// ====================
// 1. 初始化
// ====================
auto.waitFor(); 
console.show();
log("脚本已启动...");

// ====================
// 2. 启动并进入“我的”页面
// ====================
function ensureAtMyPage() {
    // 如果当前屏幕上有“继续领”或者“我的”，说明还在正轨上
    if (textContains("继续领").exists()) return true;
    
    // 如果不在，尝试启动App并点“我的”
    log("正在重置状态，回到'我的'页面...");
    launchApp("汽水音乐");
    sleep(3000);
    
    var myTab = text("我的").findOne(5000);
    if (myTab) {
        click(myTab.bounds().centerX(), myTab.bounds().centerY());
        sleep(2000);
        return true;
    }
    return false;
}

// 先执行一次启动
ensureAtMyPage();


// ====================
// 3. 主循环 (简化版)
// ====================
log("--- 进入主循环 ---");

while (true) {
    // 直接找“继续领”按钮，把它当作广告入口
    var startBtn = textContains("继续领").findOne(3000);
    
    if (startBtn) {
        log("发现'继续领'，点击开始看广告");
        
        // 点击“继续领”
        click(startBtn.bounds().centerX(), startBtn.bounds().centerY());
        
        // 既然你说点了直接进广告，那这里就不需要再找其他按钮了
        // 直接进入“看广告+关广告”的流程
        waitAndCloseAd();
        
        // 出来后休息一下
        var delayTime = random(4000, 7000);
        log("休息 " + (delayTime / 1000).toFixed(1) + " 秒...");
        sleep(delayTime);
        
    } else {
        log("未找到'继续领'按钮，正在检查状态...");
        
        // 找不到按钮时，可能是已经领完了，或者页面没加载出来
        // 尝试判断是否还在“我的”页面，如果不在就点一下
        var myTab = text("我的").findOnce();
        if (myTab && !myTab.isSelected()) {
             click(myTab.bounds().centerX(), myTab.bounds().centerY());
        }
        
        sleep(3000);
    }
}


// ====================
// 4. 广告处理 (含连播逻辑)
// ====================
function waitAndCloseAd() {
    // 刚点完“继续领”，给广告一点加载时间
    log("正在加载广告...");
    sleep(3000); 

    while (true) {
        log(">>> 广告播放中 (等待35秒) <<<");
        sleep(35000); 
        
        // --- 关闭广告 ---
        var feedbackBtn = text("反馈").findOne(2000);
        if (feedbackBtn) {
            log("通过'反馈'定位关闭");
            click(device.width - 80, feedbackBtn.bounds().centerY());
        } else {
            log("盲点右上角关闭");
            click(device.width * 0.92, device.height * 0.065);
        }
        
        // --- 连环弹窗检测 ---
        log("检测是否有下一条...");
        sleep(3000); // 这里的等待很重要，要等弹窗出来
        
        // 1. 如果出现【领取奖励】 -> 点击并继续下一轮
        var continueBtn = textContains("领取奖励").findOne(2000) || descContains("领取奖励").findOne(2000);
        if (continueBtn) {
            log("✔ 触发连播：点击领取奖励");
            click(continueBtn.bounds().centerX(), continueBtn.bounds().centerY());
            // 点击后，直接跳回循环开头，继续等35秒
            continue; 
        } 
        
        // 2. 如果出现【坚持退出】 -> 点击并结束
        var exitBtn = textContains("坚持退出").findOne(1000);
        if (exitBtn) {
            log("点击'坚持退出'");
            click(exitBtn.bounds().centerX(), exitBtn.bounds().centerY());
            sleep(2000);
        }
        
        // 如果没有“领取奖励”，也没“坚持退出”，说明已经自动回到了主页
        // 跳出循环
        log("广告流程结束");
        break; 
    }
}