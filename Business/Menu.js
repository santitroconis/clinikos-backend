class Menu {
  constructor() {}

  async getMenus(params) {
    const menus = await db.query("getMenus", [params.userProfile]);
    return menus.rows;
  }
}

module.exports = Menu;
