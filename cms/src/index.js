'use strict';

const sitePages = require('./seed/pages');

/**
 * Content is deliberately permissioned through Strapi's admin panel. After the
 * first start, enable the desired `find` and `findOne` actions for the Public
 * role under Settings → Users & Permissions → Roles → Public.
 */
module.exports = {
  register() {},
  async bootstrap({ strapi }) {
    const pages = strapi.db.query('api::page.page');

    for (const page of sitePages) {
      const existing = await pages.findOne({ where: { route: page.route } });

      if (!existing) {
        await pages.create({
          data: {
            ...page,
            publishedAt: new Date(),
          },
        });
      }
    }
  },
};
