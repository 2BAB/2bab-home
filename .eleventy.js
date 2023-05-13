
const rss = require("@11ty/eleventy-plugin-rss");
const dayjs = require('dayjs')
const modern = require('eleventy-plugin-modern')
const toc = require('markdown-it-toc-done-right')
const i18n = require('eleventy-plugin-i18n');
var locale = 'en'
module.exports = config => {
  config.addPlugin(modern({
    markdownIt(md) {
      md.use(toc)
    }
  }))
  config.addPlugin(rss) 

  config.addPassthroughCopy("favicon.ico");

  config.addShortcode("date", (content) => {
    return dayjs(content).format('YYYY/MM/DD')
  })

  config.addPlugin(i18n, {
    translations: {
      commentMethod: {
        'en': 'For comments and further discussion, mail to xx2bab@gmail.com',
        'zh': '评论和交流请发送邮件到 xx2bab@gmail.com'
      },
      menuPost: {
        'en': 'Posts',
        'zh': '文章'
      },
      menuBook: {
        'en': 'Books',
        'zh': '书籍'
      },
      menuPodcast: {
        'en': 'Podcasts',
        'zh': '播客'
      },
      menuTalk: {
        'en': 'Talks',
        'zh': '演讲'
      },
    },
    fallbackLocales: {
      '*': 'en'
    }
  });

  // config.setBrowserSyncConfig({
  //   callbacks: {
  //     ready: function (err, bs) {
  //       bs.addMiddleware('*', (req, res) => {
  //         if (req.url === '/') {
  //           res.writeHead(302, {
  //             location: '/en/'
  //           });
  //           res.end();
  //         }
  //       });
  //     }
  //   }
  // });

  return {
    markdownTemplateEngine: false
  };
}