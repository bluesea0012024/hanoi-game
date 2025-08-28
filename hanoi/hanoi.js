Page({
  data: {
    numDiscs: 3, // 首次进入默认 3 个盘
    pegs: [[], [], []], // 每个柱子的圆盘id栈（从小到大叠放，数组末尾是顶部）
    discs: [], // {id, size, width, color, x, y, pegIndex, zIndex, dragging}
    // 布局
    areaLeft: 0,
    areaTop: 0,
    areaWidth: 0,
    areaHeight: 520, // 与 wxss 保持一致
    pegCenters: [0, 0, 0],
    pegWidth: 14,
    pegHeight: 420,
    baseBottom: 30,
    discHeight: 32,
    levelGap: 38, // 层高
    colors: ["#FF8A80","#FFB74D","#FFD54F","#AED581","#4FC3F7","#9575CD","#F06292","#4DB6AC","#BA68C8"],
    // 弹窗与过关
    showLevelPicker: false,
    levelOptions: [2,3,4,5,6,7,8,9], // 修改：支持 2~9 个
    showCongratsModal: false,
    // 新增：奖状数据
    nickname: '',
    currentDate: '',
    startTime: 0,
    moves: 0,
    hanoiStats: []
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    // game-area 内左右各留 20px 内边距（见 .base）
    const areaWidth = sys.windowWidth - 24 /*page padding*/ - 24 /*page padding*/; // 更接近实际宽
    this.setData({
      areaWidth,
      pegCenters: [areaWidth * 2/8, areaWidth * 4.5/8, areaWidth * 7/8]
    });
    const app = getApp();
    const nickname = app?.globalData?.nickname || wx.getStorageSync('nickname') || '小朋友';
    const d = new Date();
    const currentDate = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
    this.setData({ nickname, currentDate });
  },

  onReady() {
    // 读取 game-area 的位置，用于 touch坐标换算
    wx.createSelectorQuery()
      .select('#gameArea')
      .boundingClientRect(rect => {
        if (rect) {
          this.setData({
            areaLeft: rect.left,
            areaTop: rect.top
          }, () => this.initGame());
        } else {
          this.initGame();
        }
      })
      .exec();
  },

  onChangeDiscs(e) {
    const v = e.detail.value;
    this.setData({ numDiscs: v }, () => this.initGame());
  },

  // 弹出层数选择
  openLevelPicker() {
    this.setData({ showLevelPicker: true });
  },
  closeLevelPicker() {
    this.setData({ showLevelPicker: false });
  },
  selectLevel(e) {
    const level = Number(e.currentTarget.dataset.level);
    this.setData({ numDiscs: level, showLevelPicker: false }, () => this.initGame());
  },
  closeCongrats() {
    this.setData({ showCongratsModal: false });
  },

  resetGame() {
    this.initGame();
  },

  initGame() {
    const N = this.data.numDiscs;
    const { areaWidth, discHeight, levelGap, colors } = this.data;

    // 单列宽度，适当放宽最大盘宽度；并让最小盘也更宽一点
    const columnWidth = areaWidth / 3;
    const maxAllowed = Math.max(76, Math.floor(columnWidth - 20)); // 原为 -28
    const maxWidth = maxAllowed;
    const minWidth = Math.max(46, Math.floor(maxWidth * 0.56));    // 原为 0.5 且下限 40
    const widthStep = N > 1 ? (maxWidth - minWidth) / (N - 1) : 0; // 按层数等分

    // 先创建圆盘对象（id 0..N-1；size N..1；label 倒序编号：最小盘=1，最大盘=N）
    const discs = [];
    for (let i = 0; i < N; i++) {
      const size = N - i; // 大的在底部，size越大越宽
      const width = Math.floor(minWidth + (size - 1) * widthStep);
      const color = colors[i % colors.length];
      discs.push({
        id: i,
        size,                       // 用于比较
        label: size,                // 倒过来编号：最小盘=1，最大盘=N
        width,
        color,
        x: 0, y: 0,
        pegIndex: 0,
        zIndex: 1,
        dragging: false,
        grabDX: 0, grabDY: 0
      });
    }

    // 打乱默认局面（有效堆叠：大在下小在上）
    const pegs = this.randomizePegs(N);

    this.setData({ pegs, discs }, () => {
      this.layoutDiscs();
    });
    // 重置计时与步数
    this.setData({ startTime: Date.now(), moves: 0 });
  },

  // 生成一个随机但有效的初始局面（不全在同一柱子）
  randomizePegs(N) {
    let attempt = 0;
    while (attempt < 20) {
      const pegs = [[], [], []];
      // 从大到小放置，保证每根柱子内部从大到小
      for (let size = N; size >= 1; size--) {
        const id = N - size; // 对应的id
        const pegIndex = Math.floor(Math.random() * 3);
        pegs[pegIndex].push(id);
      }
      // 确保不是一开始就完成（全部在一根柱子）
      const full = pegs.some(p => p.length === N);
      if (!full) return pegs;
      attempt++;
    }
    // 兜底：强行把最小的移到另一根柱子
    const pegs = [[], [], []];
    for (let size = N; size >= 1; size--) pegs[0].push(N - size);
    pegs[1].push(pegs[0].pop());
    return pegs;
  },

  layoutDiscs() {
    const { pegs, discs, pegCenters, discHeight, levelGap, baseBottom } = this.data;
    const updated = discs.map(d => ({ ...d }));
    for (let pegIndex = 0; pegIndex < 3; pegIndex++) {
      const stack = pegs[pegIndex];
      for (let level = 0; level < stack.length; level++) {
        const id = stack[level];
        const disc = updated.find(x => x.id === id);
        const levelFromBottom = level; // 0 是最底层
        const y = this.data.areaHeight - baseBottom - discHeight - levelFromBottom * levelGap;
        const x = pegCenters[pegIndex] - disc.width / 2;
        disc.x = x;
        disc.y = y;
        disc.pegIndex = pegIndex;
        disc.zIndex = 1 + level; // 简单控制层次
      }
    }
    this.setData({ discs: updated });
  },

  // 工具：获取某柱子顶部圆盘id
  getTopDiscId(pegIndex) {
    const stack = this.data.pegs[pegIndex];
    if (!stack.length) return null;
    return stack[stack.length - 1];
  },

  // 是否允许拖拽该圆盘（必须是所在柱子的顶部）
  canDrag(id) {
    const disc = this.data.discs.find(d => d.id === id);
    if (!disc) return false;
    const topId = this.getTopDiscId(disc.pegIndex);
    return topId === id;
  },

  onDiscTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    if (!this.canDrag(id)) return;

    const touch = e.touches[0];
    const disc = this.data.discs.find(d => d.id === id);
    const grabDX = touch.pageX - this.data.areaLeft - disc.x;
    const grabDY = touch.pageY - this.data.areaTop - disc.y;

    disc.dragging = true;
    disc.zIndex = 999;
    disc.grabDX = grabDX;
    disc.grabDY = grabDY;

    this.setData({ discs: this.data.discs });
  },

  onDiscTouchMove(e) {
    const id = e.currentTarget.dataset.id;
    const disc = this.data.discs.find(d => d.id === id);
    if (!disc || !disc.dragging) return;

    const touch = e.touches[0];
    let x = touch.pageX - this.data.areaLeft - disc.grabDX;
    let y = touch.pageY - this.data.areaTop - disc.grabDY;

    // 限制在游戏区域内
    x = Math.max(0, Math.min(x, this.data.areaWidth - disc.width));
    y = Math.max(0, Math.min(y, this.data.areaHeight - this.data.discHeight));

    disc.x = x;
    disc.y = y;

    this.setData({ discs: this.data.discs });
  },

  onDiscTouchEnd(e) {
    const id = e.currentTarget.dataset.id;
    const disc = this.data.discs.find(d => d.id === id);
    if (!disc || !disc.dragging) return;

    // 目标柱子：距离圆盘中心最近的柱子
    const centerX = disc.x + disc.width / 2;
    const { pegCenters } = this.data;
    let targetPeg = 0;
    let bestDist = Math.abs(centerX - pegCenters[0]);
    for (let i = 1; i < 3; i++) {
      const d = Math.abs(centerX - pegCenters[i]);
      if (d < bestDist) {
        bestDist = d;
        targetPeg = i;
      }
    }

    const sourcePeg = disc.pegIndex;
    const movingSize = disc.size;
    const targetTopId = this.getTopDiscId(targetPeg);
    const targetTopSize = (targetTopId === null) ? Infinity : this.data.discs.find(d => d.id === targetTopId).size;

    // 规则：只能放到空柱子或比自己大的圆盘上
    let pegs = this.data.pegs.map(p => p.slice());
    let moved = false;
    if (targetPeg !== sourcePeg && movingSize < targetTopSize) {
      pegs[sourcePeg].pop();
      pegs[targetPeg].push(disc.id);
      moved = true; // 记录有效移动
    }

    disc.dragging = false;
    disc.zIndex = 1;

    this.setData({ pegs, discs: this.data.discs }, () => {
      if (moved) {
        this.setData({ moves: this.data.moves + 1 });
      }
      this.layoutDiscs();
      // 胜利检测：任意一根柱子堆满（N个盘）即胜利
      const N = this.data.numDiscs;
      if (this.data.pegs.some(p => p.length === N)) {
        const elapsed = Math.max(0, Math.round((Date.now() - this.data.startTime) / 1000));
        const titleName = '汉诺塔小达人';
        const achievement = '恭喜你完成汉诺塔！';
        // 跳转到奖状页（单独页面展示）
        wx.navigateTo({
          url: `/certificate/certificate?source=hanoi&elapsed=${elapsed}&moves=${this.data.moves}&title=${encodeURIComponent(titleName)}&achievement=${encodeURIComponent(achievement)}`
        });
        // 可选：如不再使用本页蒙层
        // this.setData({ showCongratsModal: false });
      }
    });
  },

  // 奖状按钮事件
  onCertificatePrimary() {
    // 跳转到小程序首页
    wx.navigateToMiniProgram({
      appId: 'wx4f87b8582ddf6b04', // 需要替换为小程序的实际appid
      path: 'pages/hanoi/hanoi',
      success: () => {},
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },
  onCertificateSecondary() {
    this.setData({ showCongratsModal: false }, () => this.initGame());
  },
  onCertificateReturn() {
    // 跳转到认识时钟小程序
    wx.navigateToMiniProgram({
      appId: 'wxddc9184835b90168', // 需要替换为认识时钟小程序的实际appid
      path: 'pages/index/index',
      success: () => {},
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },
  onCertificateNickname() {
    // 跳到可改昵称的页面（沿用现有证书页的昵称修改能力）
    wx.navigateTo({ url: '/certificate/certificate' });
  },
  onCertificateShare() {
    // 作为 open-type=share 的补充（某些环境下触发），给个提示
    wx.showToast({ title: '点击右上角分享或选择朋友', icon: 'none' });
  },
  // 分享配置（触发自组件内的 open-type="share"）
  onShareAppMessage() {
    return {
      title: `${this.data.nickname}完成了汉诺塔挑战，快来试试吧！`,
      path: '/hanoi/hanoi',
      // imageUrl 可自行准备一张分享图
    };
  },
  // 新增：未上线功能提示
  comingSoon: function() {
    wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none'
    });
  },
  // 跳转到认识时钟小程序
  goToTickClock: function() {
    wx.navigateToMiniProgram({
      appId: 'wxddc9184835b90168', // 汉诺塔小程序appid
      path: '/pages/index/index',
      success: () => {},
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },
  // 跳转到乘法花园小程序
  goToNumber99: function() {
    wx.navigateToMiniProgram({
      appId: 'wx46ae35e8f88a9813', // 乘法花园appid
      path: '/pages/index/index',
      success: () => {},
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

});