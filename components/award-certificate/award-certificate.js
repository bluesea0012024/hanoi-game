Component({
  properties: {
    nickname: { type: String, value: "小朋友" },
    title: { type: String, value: "超级奖状" },
    achievementText: { type: String, value: "恭喜你在练习中表现超棒！" },
    stats: { type: Array, value: [] },
    appName: { type: String, value: "认识时钟小程序" },
    date: { type: String, value: "" },
    // 新增三个按钮文案
    shareText: { type: String, value: "分享给朋友" },
    returnText: { type: String, value: "回到首页" },
    nicknameText: { type: String, value: "修改昵称" }
  },
  methods: {
    onPrimary() { this.triggerEvent("primary"); },
    onSecondary() { this.triggerEvent("secondary"); },
    onShareTap() { this.triggerEvent("share"); },   // 作为 open-type="share" 的补充回调
    onReturn() { this.triggerEvent("return"); },
    onNickname() { this.triggerEvent("nickname"); }
  }
});