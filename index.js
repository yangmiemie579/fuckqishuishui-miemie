// ====================
// 0. 坐标配置（根据设备屏幕调整）
// ====================
// 屏幕基准: 荣耀VS3外屏 2376×1060
// 坐标来源: 像素级标注 [ymin,xmin,ymax,xmax] 0-1000 归一化
var COORD = {
    // 广告页右上角关闭按钮
    // 标注: 奖励倒计时区[043,515,080,955]右端 → 中心(0.93, 0.062)
    closeX: 0.93,
    closeY: 0.062,
    // "反馈"旁关闭按钮水平偏移量(px)
    // 反馈[043,355,080,470]中心X=0.41, 关闭X=0.93 → 偏移=2376×0.07≈166px
    feedbackCloseOffset: 166,
    // 领取奖励 / 继续观看 盲点区域（两者按钮位置相同）
    // 标注: 领取奖励[505,195,560,805] / 继续观看[505,195,564,805] → 中心(0.5, 0.5325)
    rewardX: 0.5,
    rewardY: 0.53,
    // 直播页退出按钮 (与广告关闭按钮位置不同)
    // 标注: 退出区[050,515,100,960] → 中心(0.95, 0.075)
    liveExitX: 0.95,
    liveExitY: 0.075,
    // 弹窗下方关闭按钮 X
    // 标注: [665,450,707,550] → 中心(0.5, 0.686)
    popupCloseX: 0.5,
    popupCloseY: 0.686,
};
// ====================
// 1. 初始化
// ====================
auto.waitFor();
console.show();
log("脚本已启动...");
// ====================
// 2. 启动并进入"我的"页面
// ====================
function ensureAtMyPage() {
    // 如果当前屏幕上有"继续领"或者"我的"，说明还在正轨上
    if (textContains("继续领").exists() || text("我的").exists()) return true;
    // 如果不在，尝试启动App并点"我的"
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
    // 如果已经领到最终奖励，结束脚本
    if (textContains("恭喜获得第30日畅听").findOnce()) {
        log("已领取第30日畅听，任务完成，准备返回桌面");
        home();
        break;
    }
    // 直接找"继续领"按钮，把它当作广告入口
    var startBtn = textContains("继续领").findOne(3000) || textContains("领时长").findOne(3000);
    if (startBtn) {
        log("发现'继续领'，点击开始看广告");
        // 点击"继续领"
        click(startBtn.bounds().centerX(), startBtn.bounds().centerY());
        // 既然你说点了直接进广告，那这里就不需要再找其他按钮了
        // 直接进入"看广告+关广告"的流程
        waitAndCloseAd();
        // 出来后休息一下
        var delayTime = random(4000, 7000);
        log("休息 " + (delayTime / 1000).toFixed(1) + " 秒...");
        sleep(delayTime);
    } else {
        log("未找到'继续领'按钮，正在检查状态...");
        // 找不到按钮时，可能是已经领完了，或者页面没加载出来
        // 尝试判断是否还在"我的"页面，如果不在就点一下
        var myTab = text("我的").findOnce();
        if (myTab && !myTab.isSelected()) {
             click(myTab.bounds().centerX(), myTab.bounds().centerY());
        }
        sleep(3000);
    }
}
function findRewardButton(timeoutMs) {
    var deadline = new Date().getTime() + timeoutMs;
    while (new Date().getTime() < deadline) {
        var btn =
            textContains("领取奖励").findOnce() ||
            descContains("领取奖励").findOnce() ||
            textMatches(/.*领取.*奖励.*/).findOnce() ||
            descMatches(/.*领取.*奖励.*/).findOnce();
        if (btn) return btn;
        sleep(300);
    }
    return null;
}
function findContinueWatchButton(timeoutMs) {
    var deadline = new Date().getTime() + timeoutMs;
    while (new Date().getTime() < deadline) {
        var btn =
            textContains("继续观看").findOnce() ||
            descContains("继续观看").findOnce() ||
            textMatches(/.*继续.*观看.*/).findOnce() ||
            descMatches(/.*继续.*观看.*/).findOnce();
        if (btn) return btn;
        sleep(300);
    }
    return null;
}
function clickButton(btn) {
    if (btn) {
        var current = btn;
        for (var i = 0; current && i < 5; i++) {
            if (current.clickable && current.clickable()) {
                return current.click();
            }
            current = current.parent();
        }
        var b = btn.bounds();
        return click(b.centerX(), b.centerY());
    }
    return click(device.width * COORD.rewardX, device.height * COORD.rewardY);
}
// ====================
// 4. 广告处理 (含连播逻辑)
// ====================
function waitAndCloseAd() {
    // 刚点完"继续领"，给广告一点加载时间
    log("正在加载广告...");
    sleep(3000);
    while (true) {
        log(">>> 广告播放中 (等待45秒) <<<");
        sleep(45000);
        // 先检查广告是否已提前结束，弹窗是否已弹出
        var earlyReward = findRewardButton(2000);
        if (earlyReward) {
            log("广告已提前结束，发现'领取奖励'，直接点击");
            clickButton(earlyReward);
            sleep(3000);
            continue;
        }
        var earlyContinue = findContinueWatchButton(2000);
        if (earlyContinue) {
            log("广告已提前结束，发现'继续观看'，点击继续看");
            clickButton(earlyContinue);
            sleep(5000);
            continue;
        }
        // 检查直播页
        var zhiboBtn = textContains("更多直播").findOne(3000)
        if(zhiboBtn){
          log("发现'更多直播'，点击退出");
          click(device.width * COORD.liveExitX, device.height * COORD.liveExitY);
        }
        // --- 关闭广告 ---
        var feedbackBtn = text("反馈").findOne(2000);
        if (feedbackBtn) {
            log("通过'反馈'定位关闭");
            click(device.width - COORD.feedbackCloseOffset, feedbackBtn.bounds().centerY());
        } else {
            log("盲点右上角关闭");
            click(device.width * COORD.closeX, device.height * COORD.closeY);
        }
        // --- 连环弹窗检测 ---
        log("检测是否有下一条...");
        sleep(3000); // 这里的等待很重要，要等弹窗出来
        // 1. 检测"继续观看" → 点击后继续看几秒广告，再进入下一轮关闭流程
        var continueBtn = findContinueWatchButton(2000);
        if (continueBtn) {
            log("发现'继续观看'按钮，点击继续看广告");
            clickButton(continueBtn);
            log("等待几秒短广告...");
            sleep(5000);
            continue;
        }
        // 2. 检测"领取奖励" → 点击继续下一轮
        var rewardBtn = findRewardButton(3000);
        if (rewardBtn) {
            log("发现'领取奖励'按钮，点击继续下一轮");
            clickButton(rewardBtn);
            sleep(3000);
            continue;
        }
        // 3. 兜底：用 Activity 检测 + 盲点
        var inRewardAdPage = currentActivity().indexOf("ExcitingVideoActivity") >= 0;
        if (inRewardAdPage) {
            log("✔ 仍在广告页但未找到按钮文本，盲点奖励区域");
            click(device.width * COORD.rewardX, device.height * COORD.rewardY);
            sleep(2500);
            continue;
        }
        // 4. 如果出现【坚持退出】 → 点击并结束
        var exitBtn = textContains("坚持退出").findOne(1000);
        if (exitBtn) {
            log("点击'坚持退出'");
            click(exitBtn.bounds().centerX(), exitBtn.bounds().centerY());
            sleep(2000);
          	break;
        }
        // 如果什么都没检测到，继续循环尝试
        log("最终未检测到奖励页或退出页，没关系不进行 break，不断的去撞击广告。");
    }
}
