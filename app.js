App({
  globalData: {
    nickname: '',
    correctCount: 0,
    totalQuestions: 0,
    startTime: null,
    endTime: null
  },
  onLaunch: function() {
    // 获取本地存储的昵称
    const nickname = wx.getStorageSync('nickname') || '玩家1';
    this.globalData.nickname = nickname;
  }
});