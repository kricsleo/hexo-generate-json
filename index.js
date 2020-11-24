'use strict';

const fs = require('hexo-fs');

// dir to store pagination json files
const jsonFilesDir = './source/json';

const paginationFilesDir = `${jsonFilesDir}/pagination`;

const postDetailFilesDir = `${jsonFilesDir}/post`;

// clear dir before write-in
function cleanDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirsSync(dir);
  }
  fs.emptyDirSync(dir);
}

/**
 * save data to local file
 * @param {string} path file path
 * @param {any} data file content
 */
function writeDateToLocal(path, data) {
  fs.writeFileSync(path, data);
}

/**
 * pick properties from object
 * @param {*} source source object
 * @param {*} keys key list
 */
function pick(source, keys) {
  return keys.reduce((allContent, curKey) => {
      allContent[curKey] = source[curKey];
      return allContent;
    }, {});
}

/**
 * generate pagination json date from hexo
 * @param {*} posts hexo site.posts
 * @param {*} perPageCount per page count configed in hexo _config.yml
 */
function generatePagination(posts, perPageCount = 10) {
  const pageCount = Math.ceil(posts.length / perPageCount);
  // include these content for now, maybe extend later
  const includeContents = ['title', 'date', 'excerpt', 'source', 'path', 'permalink', 'photos', 'link'];
  const pages = posts.reduce((all, cur, idx) => {
    const post = pick(cur, includeContents);
    const curPage = all[Math.floor(idx / perPageCount)];
    curPage.result.push(post);
    return all;
  }, new Array(pageCount).fill('').map(() => ({
    hasMore: false,
    totalCount: 0,
    result: []
  })));
  pages.forEach((page, idx) => {
    page.hasMore = idx !== pageCount - 1;
    page.totalCount = posts.length;
    page.totalPage = pageCount;
    page.currentPage = idx;
    page.currentCount = page.result.length;
  })
  return pages;
}

/**
 *
 * @param {*} posts post list
 */
function generatePosts(posts) {
  const includeContents = [
    'title', 'date', 'updated', 'comments', 'layout', 'content', 'excerpt', 'more',
    'source', 'full_source', 'path', 'permalink', 'photos', 'link'
  ];
  return posts.map(post => pick(post, includeContents));
}

/**
 * hexo plugin
 * @param {*} site
 */
function paginationJson(site) {
  const { posts: postsRaw } = site;

  // write pagination data
  cleanDir(paginationFilesDir);
  const pages = generatePagination(postsRaw, hexo.config.per_page);
  pages.forEach((pagination, idx) =>
    writeDateToLocal(`${paginationFilesDir}/${idx}.json`, JSON.stringify(pagination))
  );

  // write post detail data
  cleanDir(postDetailFilesDir);
  const posts = generatePosts(postsRaw);
  posts.forEach(post =>
    writeDateToLocal(`${postDetailFilesDir}/${post.path.replace(/\//, '_')}.json`, JSON.stringify(post))
  );
}

hexo.extend.generator.register('pagination-json', paginationJson);