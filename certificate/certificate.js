// pages/certificate/certificate.js
Page({
  data: {
    nickname: '玩家1',
    scorePercent: 0,
    elapsedTime: 0,
    beatPercent: 85,
    currentDate: '',
    showNicknameModal: false,
    newNickname: '',
    // 新增：来源、成就文案与通用统计项
    source: 'clock',
    achievementText: '恭喜你在汉诺塔练习中表现超棒！',
    stats: [],
    // 新增：用于标识是否从游戏完成跳转过来
    hasCertificateData: false
  },

  onLoad: function(options) {
    // 获取全局数据
    const app = getApp();
    const nickname = app.globalData.nickname || wx.getStorageSync('nickname') || '玩家1';
    const d = new Date();
    const currentDate = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

    // 如果没有传递参数，说明是直接访问证书页面
    if (!options || Object.keys(options).length === 0) {
      // 显示提示信息，说明还没有获得证书
      wx.showToast({
        title: '暂无证书数据',
        icon: 'none'
      });
      
      // 设置默认数据
      this.setData({
        nickname,
        currentDate,
        hasCertificateData: false,
        achievementText: '完成汉诺塔挑战即可获得奖状！',
        stats: [
          { icon: '⏱️', label: '用时', value: '--' },
          { icon: '🏆', label: '步数', value: '--' },
          { icon: '🎖️', label: '称号', value: '汉诺塔小达人' }
        ]
      });
      return;
    }

    const source = (options && options.source) || 'clock';
    let achievementText = (options && options.achievement) ? decodeURIComponent(options.achievement) : '恭喜你在汉诺塔练习中表现超棒！';
    this.setData({ hasCertificateData: true });

    if (source === 'hanoi') {
      // 汉诺塔模式：用时 + 步数 + 称号
      const elapsedTime = Number(options?.elapsed || 0);
      const moves = Number(options?.moves || 0);
      const titleName = options?.title ? decodeURIComponent(options.title) : '汉诺塔小达人';
      const stats = [
        { icon: '⏱️', label: '用时', value: `${elapsedTime}秒` },
        { icon: '🏆', label: '步数', value: `${moves}步` },
        { icon: '🎖️', label: '称号', value: titleName }
      ];
      this.setData({
        source,
        nickname,
        currentDate,
        achievementText,
        elapsedTime,
        stats,
        // 兼容旧字段（不用也保留）
        scorePercent: 0,
        beatPercent: 0,
        newNickname: nickname
      });
    } else {
      // 认识时钟模式：用时 + 超越 + 称号
      const correctCount = app.globalData.correctCount || 0;
      const totalQuestions = app.globalData.totalQuestions || 0;
      const startTime = app.globalData.startTime;
      const endTime = app.globalData.endTime;
      let scorePercent = 0;
      if (totalQuestions > 0) {
        scorePercent = Math.round((correctCount / totalQuestions) * 100);
      }
      let elapsedTime = 0;
      if (startTime && endTime) {
        elapsedTime = Math.round((endTime - startTime) / 1000);
      }
      const beatPercent = Math.floor(Math.random() * 30) + 70; // 70-99
      const stats = [
        { icon: '⏱️', label: '用时', value: `${elapsedTime}秒` },
        { icon: '🏆', label: '超越', value: `${beatPercent}%` },
        { icon: '🎖️', label: '称号', value: '时间小达人' }
      ];
      this.setData({
        source,
        nickname,
        currentDate,
        achievementText,
        elapsedTime,
        beatPercent,
        scorePercent,
        stats,
        newNickname: nickname
      });
    }
  },

  // // 返回时钟小程序
  // backToHome: function() {
  //   wx.navigateToMiniProgram({
  //     appId: 'wx4f87b8582ddf6b04', // 需要替换为认识时钟小程序的实际appid
  //     path: 'pages/hanoi/hanoi',
  //     success: () => {},
  //     fail: () => {
  //       wx.showToast({ title: '跳转失败', icon: 'none' });
  //     }
  //   });
  // },
  
  // 返回首页
  backToHome: function() {
    wx.navigateBack({
      delta: 1 // 返回上一页
    });
  },

  // 显示修改昵称弹窗
  modifyNickname: function() {
    this.setData({
      showNicknameModal: true
    });
  },

  // 昵称输入事件
  onNicknameInput: function(e) {
    this.setData({
      newNickname: e.detail.value
    });
  },

  // 提交新昵称
  submitNickname: function() {
    const newNickname = this.data.newNickname || '玩家1';
    
    // 保存昵称到本地存储和全局数据
    wx.setStorageSync('nickname', newNickname);
    getApp().globalData.nickname = newNickname;
    
    // 更新页面显示
    this.setData({
      nickname: newNickname,
      showNicknameModal: false
    });
    
    // 显示提示
    wx.showToast({
      title: '昵称已修改',
      icon: 'success'
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    const { nickname, source } = this.data;
    const title = source === 'hanoi'
      ? `${nickname}完成了汉诺塔挑战并获得奖状！`
      : `${nickname}在汉诺塔小程序中获得了奖状！`;
    const path = source === 'hanoi' ? '/hanoi/hanoi' : '/pages/index/index';
    return {
      title,
      path,
      imageUrl: '/assets/share-image.png'
    };
  }
});