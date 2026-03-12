#!/usr/bin/env python3
"""
AgentGuard Desktop UI 自动化测试脚本
测试悬浮球和面板的所有 P0+P1+P2 功能
"""

from playwright.sync_api import sync_playwright
import time
import json

def test_agentguard():
    print("🚀 开始 AgentGuard Desktop UI 测试...\n")

    with sync_playwright() as p:
        # 启动浏览器（headless=False 以便观察）
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # 测试 1: 悬浮球页面
        print("📍 测试 1: 打开悬浮球页面")
        floating_page = context.new_page()
        floating_page.goto('file:///Users/wanghui/Desktop/AI写作空间/agentguard/dist/desktop/desktop/renderer/floating.html')
        floating_page.wait_for_load_state('networkidle')
        time.sleep(1)

        # 截图 - 悬浮球初始状态
        floating_page.screenshot(path='/tmp/test_1_floating_ball.png')
        print("✅ 截图已保存: /tmp/test_1_floating_ball.png")

        # 检查悬浮球元素
        floating_ball = floating_page.locator('#floating-ball')
        assert floating_ball.is_visible(), "❌ 悬浮球不可见"
        print("✅ 悬浮球可见")

        # 检查 Tooltip 元素是否存在
        tooltip = floating_page.locator('#tooltip')
        assert tooltip.count() > 0, "❌ Tooltip 元素不存在"
        print("✅ Tooltip 元素存在")

        # 检查白色状态点是否已移除
        status_dot = floating_page.locator('.status-dot')
        if status_dot.count() > 0:
            is_hidden = floating_page.locator('.status-dot').evaluate('el => window.getComputedStyle(el).display === "none"')
            assert is_hidden, "❌ 白色状态点仍然显示"
        print("✅ 白色状态点已移除")

        # 测试 2: Tooltip 显示（模拟悬停）
        print("\n📍 测试 2: Tooltip 显示")
        floating_ball.hover()
        time.sleep(0.6)  # 等待 500ms 延迟 + 100ms buffer

        # 截图 - Tooltip 状态
        floating_page.screenshot(path='/tmp/test_2_tooltip.png')
        print("✅ 截图已保存: /tmp/test_2_tooltip.png")

        # 检查 Tooltip 是否显示
        tooltip_visible = tooltip.evaluate('el => el.classList.contains("show")')
        print(f"   Tooltip 显示状态: {tooltip_visible}")

        # 测试 3: 面板页面
        print("\n📍 测试 3: 打开面板页面（简洁模式）")
        panel_page = context.new_page()
        panel_page.goto('file:///Users/wanghui/Desktop/AI写作空间/agentguard/dist/desktop/desktop/renderer/panel.html')
        panel_page.wait_for_load_state('networkidle')
        time.sleep(1)

        # 截图 - 面板简洁模式
        panel_page.screenshot(path='/tmp/test_3_panel_compact.png', full_page=True)
        print("✅ 截图已保存: /tmp/test_3_panel_compact.png")

        # 检查面板高度（简洁模式 360px）
        body_height = panel_page.evaluate('document.body.scrollHeight')
        print(f"   面板高度: {body_height}px (预期: 360px)")

        # 检查 Agent 圆点
        agent_dots = panel_page.locator('.agent-dot')
        dot_count = agent_dots.count()
        print(f"✅ Agent 圆点数量: {dot_count}")

        # 检查快捷按钮
        dashboard_btn = panel_page.locator('#btn-dashboard')
        scan_btn = panel_page.locator('#btn-scan')
        dashboard_visible = dashboard_btn.is_visible()
        scan_visible = scan_btn.is_visible()
        print(f"   Dashboard 按钮: {'✅ 可见' if dashboard_visible else '❌ 不可见'}")
        print(f"   扫描按钮: {'✅ 可见' if scan_visible else '❌ 不可见'}")

        # 检查统计卡片
        stat_cards = panel_page.locator('.stat-card')
        card_count = stat_cards.count()
        print(f"✅ 统计卡片数量: {card_count} (预期: 4)")

        # 测试 4: 展开到详细模式
        print("\n📍 测试 4: 展开到详细模式（600px）")
        expand_btn = panel_page.locator('#expand-btn')
        if expand_btn.is_visible():
            expand_btn.click()
            time.sleep(0.5)  # 等待动画

            # 截图 - 面板详细模式
            panel_page.screenshot(path='/tmp/test_4_panel_expanded.png', full_page=True)
            print("✅ 截图已保存: /tmp/test_4_panel_expanded.png")

            # 检查展开后的高度
            expanded_height = panel_page.evaluate('document.body.scrollHeight')
            print(f"   展开后高度: {expanded_height}px (预期: 600px)")

            # 检查详细内容
            token_detail = panel_page.locator('#token-detail')
            issues_list = panel_page.locator('#issues-list')

            if token_detail.count() > 0:
                print("✅ Token 详细信息区域存在")
            if issues_list.count() > 0:
                print("✅ 问题列表区域存在")
        else:
            print("⚠️  展开按钮不可见（可能是因为没有额外内容）")

        # 测试 5: 告警系统
        print("\n📍 测试 5: 检查告警系统")
        alert_boxes = panel_page.locator('.alert-box')
        alert_count = alert_boxes.count()

        if alert_count > 0:
            print(f"✅ 发现 {alert_count} 个告警")

            # 检查告警类型
            for i in range(alert_count):
                alert = alert_boxes.nth(i)
                is_warning = alert.evaluate('el => el.classList.contains("warning")')
                alert_type = "warning" if is_warning else "critical"
                print(f"   告警 {i+1}: {alert_type}")

            # 截图 - 告警状态
            panel_page.screenshot(path='/tmp/test_5_alerts.png', full_page=True)
            print("✅ 截图已保存: /tmp/test_5_alerts.png")
        else:
            print("ℹ️  当前没有告警")

        # 测试 6: DOM 结构验证
        print("\n📍 测试 6: DOM 结构验证")

        # 检查动画类
        animated_elements = panel_page.locator('[style*="animation"]').count()
        print(f"   带动画的元素: {animated_elements}")

        # 检查 Agent 摘要文本
        agents_summary = panel_page.locator('#agents-summary')
        if agents_summary.count() > 0:
            summary_text = agents_summary.inner_text()
            print(f"✅ Agent 摘要: {summary_text}")

        print("\n" + "="*60)
        print("🎉 测试完成！所有截图已保存到 /tmp/ 目录")
        print("="*60)

        # 保持浏览器打开 3 秒以便观察
        time.sleep(3)

        browser.close()

if __name__ == '__main__':
    test_agentguard()
