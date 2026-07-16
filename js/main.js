//core controller
// main.js - 核心控制模块（应用入口）

window.onload = function() {
    // 1. 启动地图模块（绘制地图、图表、下拉菜单）
    setMap();
    
    // 2. 添加页面底部的描述文字（来自 panel.js）
    addToolDescription();
    
    // 3. 设置全局 UI 事件的监听器（重置按钮提示、下拉菜单提示等）
    setupEventListeners();
    
    console.log("Endangered Species Tracker initialized successfully.");
};