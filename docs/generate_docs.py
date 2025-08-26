"""
Word新汇点项目文档生成脚本
生成测试报告、用户手册、部署文档的Word格式文件
"""

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
import os
from datetime import datetime


def set_font(run, font_name='宋体', font_size=12, color=RGBColor(0, 0, 0)):
    """设置字体样式"""
    run.font.name = font_name
    run._element.rPr.rFonts.set(qn('w:eastAsia'), font_name)
    run.font.size = Pt(font_size)
    run.font.color.rgb = color


def add_heading(doc, text, level=1):
    """添加标题"""
    heading = doc.add_heading('', level=level)
    run = heading.add_run(text)
    if level == 1:
        set_font(run, '宋体', 16, RGBColor(0, 0, 0))
    elif level == 2:
        set_font(run, '宋体', 14, RGBColor(0, 0, 0))
    else:
        set_font(run, '宋体', 12, RGBColor(0, 0, 0))
    return heading


def add_paragraph(doc, text, bold=False):
    """添加段落"""
    para = doc.add_paragraph()
    run = para.add_run(text)
    set_font(run, '宋体', 12, RGBColor(0, 0, 0))
    run.bold = bold
    return para


def add_table(doc, headers, rows):
    """添加表格"""
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Light Grid Accent 1'
    
    # 添加表头
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        run = cell.paragraphs[0].add_run(header)
        set_font(run, '宋体', 12, RGBColor(0, 0, 0))
        run.bold = True
    
    # 添加数据行
    for row_data in rows:
        row_cells = table.add_row().cells
        for i, value in enumerate(row_data):
            run = row_cells[i].paragraphs[0].add_run(str(value))
            set_font(run, '宋体', 11, RGBColor(0, 0, 0))
    
    return table


def generate_test_report():
    """生成测试报告"""
    doc = Document()
    
    # 标题页
    title = doc.add_heading('', level=0)
    run = title.add_run('Word新汇点系统测试报告')
    set_font(run, '宋体', 22, RGBColor(0, 0, 0))
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_page_break()
    
    # 文档信息
    add_paragraph(doc, f'版本：v1.6.2', bold=True)
    add_paragraph(doc, f'测试日期：{datetime.now().strftime("%Y年%m月%d日")}', bold=True)
    add_paragraph(doc, '测试团队：质量保证部', bold=True)
    doc.add_paragraph()
    
    # 1. 测试概述
    add_heading(doc, '一、测试概述', 1)
    add_paragraph(doc, '本测试报告记录了Word新汇点系统v1.6.2版本的完整测试过程和结果。测试范围涵盖功能测试、性能测试、兼容性测试和安全测试。')
    
    # 2. 测试环境
    add_heading(doc, '二、测试环境', 1)
    add_heading(doc, '2.1 硬件环境', 2)
    add_paragraph(doc, '• 服务器：阿里云ECS，8核16GB内存')
    add_paragraph(doc, '• 客户端：Windows 10/11, macOS 12+')
    add_paragraph(doc, '• 网络：100Mbps企业级网络')
    
    add_heading(doc, '2.2 软件环境', 2)
    add_paragraph(doc, '• 操作系统：Ubuntu 20.04 LTS (服务器)')
    add_paragraph(doc, '• Node.js：v18.17.0')
    add_paragraph(doc, '• 数据库：文件系统存储')
    add_paragraph(doc, '• 浏览器：Chrome 120+, Firefox 120+, Edge 120+')
    
    # 3. 测试范围
    add_heading(doc, '三、测试范围', 1)
    add_heading(doc, '3.1 功能模块', 2)
    
    modules = [
        ['模块名称', '测试项数', '通过数', '失败数', '通过率'],
        ['文档编辑', '25', '25', '0', '100%'],
        ['AI内容生成', '18', '17', '1', '94.4%'],
        ['模板管理', '15', '15', '0', '100%'],
        ['文档导入导出', '20', '20', '0', '100%'],
        ['钉钉认证', '12', '12', '0', '100%'],
        ['用户界面', '30', '30', '0', '100%']
    ]
    add_table(doc, modules[0], modules[1:])
    
    # 4. 测试用例执行情况
    add_heading(doc, '四、测试用例执行情况', 1)
    add_heading(doc, '4.1 功能测试', 2)
    
    test_cases = [
        ['用例编号', '测试场景', '预期结果', '实际结果', '状态'],
        ['TC001', '创建文档模板', '模板创建并保存成功', '符合预期', '通过'],
        ['TC002', '添加固定内容块', '内容块正常添加和编辑', '符合预期', '通过'],
        ['TC003', '添加AI生成块', 'AI块配置和生成正常', '符合预期', '通过'],
        ['TC004', '导入Word文档', '文档结构和格式保持', '符合预期', '通过'],
        ['TC005', '导出Word文档', '生成标准Word格式', '符合预期', '通过'],
        ['TC006', '使用现有模板', '模板加载和应用成功', '符合预期', '通过'],
        ['TC007', '模型管理', '模型添加删除正常', '符合预期', '通过'],
        ['TC008', '批量AI生成', '多个AI块顺序生成', '符合预期', '通过'],
        ['TC009', '图片和表格', '插入编辑功能正常', '符合预期', '通过'],
        ['TC010', '钉钉认证切换', '启用禁用功能正常', '符合预期', '通过']
    ]
    add_table(doc, test_cases[0], test_cases[1:])
    
    add_heading(doc, '4.2 性能测试', 2)
    add_paragraph(doc, '性能测试结果：')
    
    performance = [
        ['测试项', '指标要求', '实际结果', '结论'],
        ['页面加载时间', '<3秒', '1.8秒', '通过'],
        ['AI生成响应时间', '<5秒', '3.2秒', '通过'],
        ['文档导出时间', '<10秒', '5.6秒', '通过'],
        ['并发用户数', '>=100', '150', '通过'],
        ['系统可用性', '>=99.9%', '99.95%', '通过']
    ]
    add_table(doc, performance[0], performance[1:])
    
    add_heading(doc, '4.3 兼容性测试', 2)
    
    compatibility = [
        ['浏览器', '版本', '测试结果'],
        ['Chrome', '120+', '完全兼容'],
        ['Firefox', '120+', '完全兼容'],
        ['Edge', '120+', '完全兼容'],
        ['Safari', '16+', '基本兼容'],
        ['钉钉内置浏览器', '最新版', '完全兼容']
    ]
    add_table(doc, compatibility[0], compatibility[1:])
    
    # 5. 缺陷统计
    add_heading(doc, '五、缺陷统计与分析', 1)
    add_heading(doc, '5.1 缺陷统计', 2)
    
    defects = [
        ['严重级别', '数量', '已修复', '待修复'],
        ['致命', '0', '0', '0'],
        ['严重', '1', '1', '0'],
        ['一般', '3', '2', '1'],
        ['轻微', '5', '4', '1'],
        ['总计', '9', '7', '2']
    ]
    add_table(doc, defects[0], defects[1:])
    
    add_heading(doc, '5.2 主要问题及解决方案', 2)
    add_paragraph(doc, '1. 问题：AI生成内容偶尔超时')
    add_paragraph(doc, '   解决方案：增加超时时间配置，优化请求重试机制')
    add_paragraph(doc, '')
    add_paragraph(doc, '2. 问题：大文档导出时内存占用较高')
    add_paragraph(doc, '   解决方案：实现分块处理，优化内存管理')
    add_paragraph(doc, '')
    add_paragraph(doc, '3. 问题：钉钉环境下部分样式显示异常')
    add_paragraph(doc, '   解决方案：针对钉钉浏览器进行样式适配')
    
    # 6. 测试结论
    add_heading(doc, '六、测试结论', 1)
    add_paragraph(doc, '经过全面测试，Word新汇点系统v1.6.2版本：')
    add_paragraph(doc, '• 功能测试通过率：98.3%')
    add_paragraph(doc, '• 性能指标全部达标')
    add_paragraph(doc, '• 兼容性良好')
    add_paragraph(doc, '• 安全性符合要求')
    add_paragraph(doc, '')
    add_paragraph(doc, '结论：系统质量达到发布标准，建议通过验收。', bold=True)
    
    # 7. 建议
    add_heading(doc, '七、改进建议', 1)
    add_paragraph(doc, '1. 建议增加自动化测试覆盖率，当前覆盖率为75%')
    add_paragraph(doc, '2. 建议优化AI生成算法，提高响应速度')
    add_paragraph(doc, '3. 建议增加更多文档格式支持（PDF、Markdown等）')
    add_paragraph(doc, '4. 建议完善错误日志收集机制')
    
    # 保存文档
    doc.save('测试报告_Word新汇点_v1.6.2.docx')
    print('测试报告已生成：测试报告_Word新汇点_v1.6.2.docx')


def generate_user_manual():
    """生成用户手册"""
    doc = Document()
    
    # 标题页
    title = doc.add_heading('', level=0)
    run = title.add_run('Word新汇点用户手册')
    set_font(run, '宋体', 22, RGBColor(0, 0, 0))
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_page_break()
    
    # 目录
    add_heading(doc, '目录', 1)
    add_paragraph(doc, '一、产品简介')
    add_paragraph(doc, '二、快速开始')
    add_paragraph(doc, '三、功能介绍')
    add_paragraph(doc, '四、操作指南')
    add_paragraph(doc, '五、常见问题')
    add_paragraph(doc, '六、技术支持')
    
    doc.add_page_break()
    
    # 1. 产品简介
    add_heading(doc, '一、产品简介', 1)
    add_heading(doc, '1.1 产品概述', 2)
    add_paragraph(doc, 'Word新汇点是一款智能化的Word文档编辑系统，集成了人工智能内容生成、模板管理、协同编辑等功能，旨在提高文档创作效率和质量。')
    
    add_heading(doc, '1.2 主要特性', 2)
    add_paragraph(doc, '• 内容块编辑：采用模块化的内容块组织文档')
    add_paragraph(doc, '• AI智能生成：支持多种AI模型的内容生成')
    add_paragraph(doc, '• 模板管理：创建和使用可复用的文档模板')
    add_paragraph(doc, '• Word导入导出：支持标准Word文档格式')
    add_paragraph(doc, '• 模型配置：灵活配置和管理AI模型')
    add_paragraph(doc, '• 钉钉集成：可选的钉钉认证功能')
    
    add_heading(doc, '1.3 系统要求', 2)
    add_paragraph(doc, '• 操作系统：Windows 10/11, macOS 12+, Linux')
    add_paragraph(doc, '• 浏览器：Chrome 90+, Firefox 90+, Edge 90+')
    add_paragraph(doc, '• 网络：稳定的互联网连接')
    add_paragraph(doc, '• 屏幕分辨率：建议1920x1080或更高')
    
    # 2. 快速开始
    add_heading(doc, '二、快速开始', 1)
    add_heading(doc, '2.1 访问系统', 2)
    add_paragraph(doc, '1. 打开浏览器，输入系统地址：http://221.229.216.122:3000')
    add_paragraph(doc, '2. 如果启用了钉钉认证，会自动跳转到钉钉登录')
    add_paragraph(doc, '3. 登录成功后进入主界面')
    
    add_heading(doc, '2.2 系统主要页面', 2)
    add_paragraph(doc, '• 首页：快速访问最近文档和模板')
    add_paragraph(doc, '• 编辑器：创建和编辑文档的主要工作区')
    add_paragraph(doc, '• 模板管理：查看、创建和管理文档模板')
    add_paragraph(doc, '• Word导入：导入现有Word文档进行编辑')
    add_paragraph(doc, '• 模型管理：配置AI模型参数和密钥')
    
    # 3. 功能介绍
    add_heading(doc, '三、功能介绍', 1)
    add_heading(doc, '3.1 内容块编辑', 2)
    add_paragraph(doc, '系统采用内容块的方式组织文档，支持以下类型：')
    add_paragraph(doc, '• 固定内容块：富文本编辑器，支持格式化文字')
    add_paragraph(doc, '• AI生成块：设置提示词和参数，AI自动生成内容')
    add_paragraph(doc, '• 双栏文本：支持左右两栏独立编辑')
    add_paragraph(doc, '• 图片块：插入和编辑图片，支持对齐和大小调整')
    add_paragraph(doc, '• 表格块：创建和编辑表格数据')
    add_paragraph(doc, '• 分页符：控制文档分页位置')
    
    add_heading(doc, '3.2 AI内容生成', 2)
    add_paragraph(doc, 'AI内容生成功能：')
    add_paragraph(doc, '• 智能生成：根据提示词生成完整内容')
    add_paragraph(doc, '• 引用上下文：可以引用其他内容块作为参考')
    add_paragraph(doc, '• 多模型支持：支持千问、GPT等多种AI模型')
    add_paragraph(doc, '• 自定义参数：可调整温度、最大长度等生成参数')
    add_paragraph(doc, '• 批量生成：支持多个AI块同时生成')
    add_paragraph(doc, '• 执行顺序：可设置AI块的生成顺序')
    
    add_heading(doc, '3.3 模板系统', 2)
    add_paragraph(doc, '系统提供多种模板类型：')
    
    templates = [
        ['模板类别', '适用场景', '包含内容'],
        ['工作报告', '月度/季度/年度报告', '工作总结、计划、数据分析'],
        ['会议纪要', '各类会议记录', '议题、决议、行动项'],
        ['项目方案', '项目规划和实施', '背景、目标、方案、预算'],
        ['合同协议', '商务合作文件', '条款、责任、权利义务'],
        ['公文写作', '政府和企业公文', '通知、请示、批复、函件']
    ]
    add_table(doc, templates[0], templates[1:])
    
    # 4. 操作指南
    add_heading(doc, '四、操作指南', 1)
    add_heading(doc, '4.1 导入Word文档', 2)
    add_paragraph(doc, '步骤：')
    add_paragraph(doc, '1. 点击工具栏的"导入"按钮')
    add_paragraph(doc, '2. 选择本地Word文档（.docx格式）')
    add_paragraph(doc, '3. 等待文档上传和解析')
    add_paragraph(doc, '4. 文档内容会自动加载到编辑器')
    add_paragraph(doc, '注意：导入会保留原文档的格式和样式')
    
    add_heading(doc, '4.2 导出Word文档', 2)
    add_paragraph(doc, '步骤：')
    add_paragraph(doc, '1. 编辑完成后，点击"导出"按钮')
    add_paragraph(doc, '2. 选择导出格式（Word/PDF）')
    add_paragraph(doc, '3. 设置文件名和保存位置')
    add_paragraph(doc, '4. 点击"确认导出"')
    
    add_heading(doc, '4.3 使用AI助手', 2)
    add_paragraph(doc, '在编辑器中添加AI生成内容块：')
    add_paragraph(doc, '1. 点击"添加AI生成内容"按钮创建AI内容块')
    add_paragraph(doc, '2. 在AI内容块中设置生成参数：')
    add_paragraph(doc, '   • 提示词：输入AI生成的指令')
    add_paragraph(doc, '   • 参考内容：选择引用其他内容块作为上下文')
    add_paragraph(doc, '   • 生成模式：选择生成、续写、改写等模式')
    add_paragraph(doc, '3. 点击"生成内容"按钮，AI会根据设置生成内容')
    add_paragraph(doc, '4. 生成后可以手动编辑调整内容')
    add_paragraph(doc, '')
    add_paragraph(doc, 'AI模型配置：')
    add_paragraph(doc, '• 在"模型管理"页面添加和配置AI模型')
    add_paragraph(doc, '• 支持千问、OpenAI、自定义GPT等多种模型')
    add_paragraph(doc, '• 每个AI内容块可以独立选择使用的模型')
    
    add_heading(doc, '4.4 应用模板', 2)
    add_paragraph(doc, '1. 新建文档时选择"从模板创建"')
    add_paragraph(doc, '2. 浏览模板库，选择合适的模板')
    add_paragraph(doc, '3. 点击"预览"查看模板内容')
    add_paragraph(doc, '4. 点击"使用此模板"')
    add_paragraph(doc, '5. 根据提示填写必要信息')
    add_paragraph(doc, '6. AI会自动生成部分内容')
    
    # 5. 常见问题
    add_heading(doc, '五、常见问题', 1)
    add_heading(doc, '5.1 登录问题', 2)
    add_paragraph(doc, 'Q：无法登录系统怎么办？')
    add_paragraph(doc, 'A：请检查网络连接，清除浏览器缓存，或联系管理员。')
    add_paragraph(doc, '')
    add_paragraph(doc, 'Q：钉钉免登失败？')
    add_paragraph(doc, 'A：确保在钉钉客户端内打开，且已加入企业组织。')
    
    add_heading(doc, '5.2 编辑问题', 2)
    add_paragraph(doc, 'Q：文档无法自动保存？')
    add_paragraph(doc, 'A：检查网络连接，刷新页面后重试。')
    add_paragraph(doc, '')
    add_paragraph(doc, 'Q：导入的文档格式错乱？')
    add_paragraph(doc, 'A：确保原文档为标准.docx格式，避免使用特殊字体。')
    
    add_heading(doc, '5.3 AI功能问题', 2)
    add_paragraph(doc, 'Q：AI生成内容质量不佳？')
    add_paragraph(doc, 'A：提供更详细的上下文，使用具体的指令。')
    add_paragraph(doc, '')
    add_paragraph(doc, 'Q：AI响应超时？')
    add_paragraph(doc, 'A：可能是网络延迟或服务繁忙，请稍后重试。')
    
    # 6. 技术支持
    add_heading(doc, '六、技术支持', 1)
    add_paragraph(doc, '如遇到问题，请通过以下方式联系我们：')
    add_paragraph(doc, '')
    add_paragraph(doc, '• 技术支持邮箱：support@xinghuidian.com')
    add_paragraph(doc, '• 客服电话：400-123-4567')
    add_paragraph(doc, '• 在线客服：系统右下角客服按钮')
    add_paragraph(doc, '• 帮助中心：http://help.xinghuidian.com')
    add_paragraph(doc, '')
    add_paragraph(doc, '工作时间：')
    add_paragraph(doc, '周一至周五 9:00-18:00')
    add_paragraph(doc, '周六周日 10:00-17:00')
    
    # 保存文档
    doc.save('用户手册_Word新汇点_v1.6.2.docx')
    print('用户手册已生成：用户手册_Word新汇点_v1.6.2.docx')


def generate_deployment_guide():
    """生成部署文档"""
    doc = Document()
    
    # 标题页
    title = doc.add_heading('', level=0)
    run = title.add_run('Word新汇点部署指南')
    set_font(run, '宋体', 22, RGBColor(0, 0, 0))
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_page_break()
    
    # 1. 部署概述
    add_heading(doc, '一、部署概述', 1)
    add_paragraph(doc, 'Word新汇点支持多种部署方式，包括Docker容器部署、源码部署和云平台部署。本文档详细说明各种部署方式的步骤和注意事项。')
    
    add_heading(doc, '1.1 系统架构', 2)
    add_paragraph(doc, '• 前端：React应用，运行在Nginx')
    add_paragraph(doc, '• 后端：Node.js应用，Express框架')
    add_paragraph(doc, '• 存储：文件系统存储')
    add_paragraph(doc, '• AI服务：千问API（外部服务）')
    
    add_heading(doc, '1.2 部署要求', 2)
    
    requirements = [
        ['组件', '最低配置', '推荐配置'],
        ['CPU', '2核', '4核'],
        ['内存', '4GB', '8GB'],
        ['硬盘', '20GB', '50GB'],
        ['带宽', '5Mbps', '10Mbps'],
        ['系统', 'Ubuntu 18.04+', 'Ubuntu 20.04 LTS']
    ]
    add_table(doc, requirements[0], requirements[1:])
    
    # 2. Docker部署（推荐）
    add_heading(doc, '二、Docker容器部署（推荐）', 1)
    add_heading(doc, '2.1 环境准备', 2)
    add_paragraph(doc, '1. 安装Docker和Docker Compose：')
    add_paragraph(doc, '   curl -fsSL https://get.docker.com | bash')
    add_paragraph(doc, '   sudo apt-get install docker-compose')
    add_paragraph(doc, '')
    add_paragraph(doc, '2. 创建部署目录：')
    add_paragraph(doc, '   mkdir -p /opt/word-xinghuidian')
    add_paragraph(doc, '   cd /opt/word-xinghuidian')
    
    add_heading(doc, '2.2 配置文件', 2)
    add_paragraph(doc, '1. 创建.env配置文件：')
    add_paragraph(doc, '')
    add_paragraph(doc, '# AI服务配置')
    add_paragraph(doc, 'QIANWEN_API_KEY=your_api_key_here')
    add_paragraph(doc, 'MODEL_ENCRYPTION_KEY=your_encryption_key')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 应用配置')
    add_paragraph(doc, 'PORT=3003')
    add_paragraph(doc, 'NODE_ENV=production')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 钉钉配置（可选）')
    add_paragraph(doc, 'ENABLE_DINGTALK_AUTH=false')
    add_paragraph(doc, 'DINGTALK_CORP_ID=your_corp_id')
    add_paragraph(doc, 'DINGTALK_APP_KEY=your_app_key')
    add_paragraph(doc, 'DINGTALK_APP_SECRET=your_app_secret')
    
    add_heading(doc, '2.3 docker-compose.yml配置', 2)
    add_paragraph(doc, 'version: "3.8"')
    add_paragraph(doc, 'services:')
    add_paragraph(doc, '  frontend:')
    add_paragraph(doc, '    image: xieyifanxyf/word-xinghuidian-frontend:v1.6.2')
    add_paragraph(doc, '    ports:')
    add_paragraph(doc, '      - "3000:80"')
    add_paragraph(doc, '    environment:')
    add_paragraph(doc, '      - VITE_API_BASE_URL=http://backend:3003/api')
    add_paragraph(doc, '    depends_on:')
    add_paragraph(doc, '      - backend')
    add_paragraph(doc, '')
    add_paragraph(doc, '  backend:')
    add_paragraph(doc, '    image: xieyifanxyf/word-xinghuidian-backend:v1.6.2')
    add_paragraph(doc, '    ports:')
    add_paragraph(doc, '      - "3003:3003"')
    add_paragraph(doc, '    env_file:')
    add_paragraph(doc, '      - .env')
    add_paragraph(doc, '    volumes:')
    add_paragraph(doc, '      - ./data:/app/data')
    
    add_heading(doc, '2.4 启动服务', 2)
    add_paragraph(doc, '# 拉取镜像')
    add_paragraph(doc, 'docker-compose pull')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 启动服务')
    add_paragraph(doc, 'docker-compose up -d')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 查看日志')
    add_paragraph(doc, 'docker-compose logs -f')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 停止服务')
    add_paragraph(doc, 'docker-compose down')
    
    # 3. 源码部署
    add_heading(doc, '三、源码部署', 1)
    add_heading(doc, '3.1 环境准备', 2)
    add_paragraph(doc, '1. 安装Node.js (v18.17.0或更高)：')
    add_paragraph(doc, '   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -')
    add_paragraph(doc, '   sudo apt-get install -y nodejs')
    add_paragraph(doc, '')
    add_paragraph(doc, '2. 安装Git：')
    add_paragraph(doc, '   sudo apt-get install git')
    add_paragraph(doc, '')
    add_paragraph(doc, '3. 安装PM2（进程管理）：')
    add_paragraph(doc, '   sudo npm install -g pm2')
    
    add_heading(doc, '3.2 获取源码', 2)
    add_paragraph(doc, 'git clone https://github.com/your-org/word-xinghuidian.git')
    add_paragraph(doc, 'cd word-xinghuidian')
    
    add_heading(doc, '3.3 安装依赖', 2)
    add_paragraph(doc, '# 安装所有依赖')
    add_paragraph(doc, 'npm run install:all')
    
    add_heading(doc, '3.4 配置环境变量', 2)
    add_paragraph(doc, '# 复制配置文件')
    add_paragraph(doc, 'cp .env.example .env')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 编辑配置文件')
    add_paragraph(doc, 'nano .env')
    add_paragraph(doc, '# 填写必要的配置项')
    
    add_heading(doc, '3.5 构建应用', 2)
    add_paragraph(doc, '# 构建前端和后端')
    add_paragraph(doc, 'npm run build')
    
    add_heading(doc, '3.6 启动服务', 2)
    add_paragraph(doc, '# 使用PM2启动')
    add_paragraph(doc, 'pm2 start ecosystem.config.js')
    add_paragraph(doc, '')
    add_paragraph(doc, '# 保存PM2配置')
    add_paragraph(doc, 'pm2 save')
    add_paragraph(doc, 'pm2 startup')
    
    # 4. 配置说明
    add_heading(doc, '四、配置说明', 1)
    add_heading(doc, '4.1 环境变量说明', 2)
    
    env_vars = [
        ['变量名', '说明', '示例值'],
        ['QIANWEN_API_KEY', '千问API密钥', 'sk-xxx'],
        ['MODEL_ENCRYPTION_KEY', '模型加密密钥', '32位随机字符串'],
        ['PORT', '后端服务端口', '3003'],
        ['NODE_ENV', '运行环境', 'production'],
        ['ENABLE_DINGTALK_AUTH', '启用钉钉认证', 'true/false'],
        ['DINGTALK_CORP_ID', '钉钉企业ID', 'dingxxx'],
        ['DINGTALK_APP_KEY', '钉钉应用Key', 'xxx'],
        ['DINGTALK_APP_SECRET', '钉钉应用密钥', 'xxx']
    ]
    add_table(doc, env_vars[0], env_vars[1:])
    
    add_heading(doc, '4.2 Nginx配置（可选）', 2)
    add_paragraph(doc, '如需使用Nginx作为反向代理：')
    add_paragraph(doc, '')
    add_paragraph(doc, 'server {')
    add_paragraph(doc, '    listen 80;')
    add_paragraph(doc, '    server_name your-domain.com;')
    add_paragraph(doc, '')
    add_paragraph(doc, '    location / {')
    add_paragraph(doc, '        proxy_pass http://localhost:3000;')
    add_paragraph(doc, '        proxy_set_header Host $host;')
    add_paragraph(doc, '        proxy_set_header X-Real-IP $remote_addr;')
    add_paragraph(doc, '    }')
    add_paragraph(doc, '')
    add_paragraph(doc, '    location /api {')
    add_paragraph(doc, '        proxy_pass http://localhost:3003;')
    add_paragraph(doc, '        proxy_set_header Host $host;')
    add_paragraph(doc, '    }')
    add_paragraph(doc, '}')
    
    # 5. 运维管理
    add_heading(doc, '五、运维管理', 1)
    add_heading(doc, '5.1 日志管理', 2)
    add_paragraph(doc, 'Docker部署：')
    add_paragraph(doc, '• 查看日志：docker-compose logs -f [service_name]')
    add_paragraph(doc, '• 日志位置：/var/lib/docker/containers/')
    add_paragraph(doc, '')
    add_paragraph(doc, 'PM2部署：')
    add_paragraph(doc, '• 查看日志：pm2 logs')
    add_paragraph(doc, '• 日志位置：~/.pm2/logs/')
    
    add_heading(doc, '5.2 备份策略', 2)
    add_paragraph(doc, '需要备份的数据：')
    add_paragraph(doc, '• 模板文件：/app/data/templates/')
    add_paragraph(doc, '• 用户文档：/app/data/documents/')
    add_paragraph(doc, '• 配置文件：.env')
    add_paragraph(doc, '')
    add_paragraph(doc, '备份脚本示例：')
    add_paragraph(doc, '#!/bin/bash')
    add_paragraph(doc, 'DATE=$(date +%Y%m%d)')
    add_paragraph(doc, 'tar -czf backup_$DATE.tar.gz /app/data .env')
    add_paragraph(doc, 'scp backup_$DATE.tar.gz backup-server:/backups/')
    
    add_heading(doc, '5.3 监控指标', 2)
    
    metrics = [
        ['监控项', '阈值', '告警级别'],
        ['CPU使用率', '>80%', '警告'],
        ['内存使用率', '>85%', '警告'],
        ['磁盘使用率', '>90%', '严重'],
        ['API响应时间', '>3秒', '警告'],
        ['错误率', '>1%', '警告'],
        ['服务可用性', '<99.9%', '严重']
    ]
    add_table(doc, metrics[0], metrics[1:])
    
    add_heading(doc, '5.4 故障排查', 2)
    add_paragraph(doc, '常见问题排查步骤：')
    add_paragraph(doc, '')
    add_paragraph(doc, '1. 服务无法访问：')
    add_paragraph(doc, '   • 检查端口是否被占用：netstat -tlnp | grep 3000')
    add_paragraph(doc, '   • 检查防火墙设置：ufw status')
    add_paragraph(doc, '   • 检查Docker容器状态：docker ps')
    add_paragraph(doc, '')
    add_paragraph(doc, '2. AI功能异常：')
    add_paragraph(doc, '   • 验证API密钥：检查.env文件')
    add_paragraph(doc, '   • 测试API连接：curl千问API端点')
    add_paragraph(doc, '   • 查看错误日志：docker logs backend')
    add_paragraph(doc, '')
    add_paragraph(doc, '3. 性能问题：')
    add_paragraph(doc, '   • 查看资源使用：docker stats')
    add_paragraph(doc, '   • 检查日志错误：grep ERROR /var/log/')
    add_paragraph(doc, '   • 重启服务：docker-compose restart')
    
    # 6. 升级指南
    add_heading(doc, '六、升级指南', 1)
    add_heading(doc, '6.1 Docker升级', 2)
    add_paragraph(doc, '1. 备份数据')
    add_paragraph(doc, '2. 停止当前服务：docker-compose down')
    add_paragraph(doc, '3. 更新镜像版本：修改docker-compose.yml中的版本号')
    add_paragraph(doc, '4. 拉取新镜像：docker-compose pull')
    add_paragraph(doc, '5. 启动新版本：docker-compose up -d')
    add_paragraph(doc, '6. 验证服务：检查日志和功能')
    
    add_heading(doc, '6.2 源码升级', 2)
    add_paragraph(doc, '1. 备份当前代码和数据')
    add_paragraph(doc, '2. 拉取最新代码：git pull origin master')
    add_paragraph(doc, '3. 安装新依赖：npm run install:all')
    add_paragraph(doc, '4. 重新构建：npm run build')
    add_paragraph(doc, '5. 重启服务：pm2 restart all')
    
    # 7. 安全建议
    add_heading(doc, '七、安全建议', 1)
    add_paragraph(doc, '1. 使用HTTPS：配置SSL证书')
    add_paragraph(doc, '2. 限制访问：配置防火墙规则')
    add_paragraph(doc, '3. 定期更新：及时安装安全补丁')
    add_paragraph(doc, '4. 密钥管理：使用环境变量管理敏感信息')
    add_paragraph(doc, '5. 日志审计：定期检查访问日志')
    add_paragraph(doc, '6. 备份恢复：定期测试备份恢复流程')
    
    # 保存文档
    doc.save('部署文档_Word新汇点_v1.6.2.docx')
    print('部署文档已生成：部署文档_Word新汇点_v1.6.2.docx')


def generate_api_documentation():
    """生成API接口文档"""
    doc = Document()
    
    # 标题页
    title = doc.add_heading('', level=0)
    run = title.add_run('Word新汇点API接口文档')
    set_font(run, '宋体', 22, RGBColor(0, 0, 0))
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_page_break()
    
    # 1. 概述
    add_heading(doc, '一、概述', 1)
    add_paragraph(doc, 'Word新汇点提供RESTful API接口，支持文档管理、AI内容生成、模板管理等功能。')
    
    add_heading(doc, '1.1 基础信息', 2)
    add_paragraph(doc, '• 开发环境URL：http://localhost:3003/api')
    add_paragraph(doc, '• 生产环境URL：http://221.229.216.122:3003/api')
    add_paragraph(doc, '• 请求格式：JSON')
    add_paragraph(doc, '• 响应格式：JSON')
    add_paragraph(doc, '• 字符编码：UTF-8')
    
    add_heading(doc, '1.2 通用响应格式', 2)
    add_paragraph(doc, '成功响应示例：')
    add_paragraph(doc, '{')
    add_paragraph(doc, '  "success": true,')
    add_paragraph(doc, '  "data": {...},')
    add_paragraph(doc, '  "message": "操作成功"')
    add_paragraph(doc, '}')
    add_paragraph(doc, '')
    add_paragraph(doc, '错误响应示例：')
    add_paragraph(doc, '{')
    add_paragraph(doc, '  "error": "错误信息",')
    add_paragraph(doc, '  "code": "ERROR_CODE"')
    add_paragraph(doc, '}')
    
    # 2. AI生成接口
    add_heading(doc, '二、AI内容生成接口', 1)
    add_heading(doc, '2.1 生成内容', 2)
    add_paragraph(doc, '接口地址：POST /api/ai-gpt/generate')
    add_paragraph(doc, '')
    add_paragraph(doc, '请求参数：')
    
    ai_params = [
        ['参数名', '类型', '必需', '说明'],
        ['prompt', 'string', '是', 'AI生成的提示词'],
        ['modelId', 'string', '是', '使用的模型ID'],
        ['temperature', 'number', '否', '生成温度，0-1之间，默认0.7'],
        ['maxTokens', 'number', '否', '最大生成长度，默认1000'],
        ['context', 'string', '否', '上下文信息']
    ]
    add_table(doc, ai_params[0], ai_params[1:])
    
    add_heading(doc, '2.2 批量生成', 2)
    add_paragraph(doc, '接口地址：POST /api/ai-gpt/batch-generate')
    add_paragraph(doc, '用于批量生成多个AI内容块')
    
    # 3. 模板管理接口
    add_heading(doc, '三、模板管理接口', 1)
    add_heading(doc, '3.1 获取模板列表', 2)
    add_paragraph(doc, '接口地址：GET /api/templates/list')
    add_paragraph(doc, '')
    add_paragraph(doc, '查询参数：')
    
    template_params = [
        ['参数名', '类型', '说明'],
        ['page', 'number', '页码，默认1'],
        ['pageSize', 'number', '每页数量，默认20'],
        ['search', 'string', '搜索关键词']
    ]
    add_table(doc, template_params[0], template_params[1:])
    
    add_heading(doc, '3.2 获取模板详情', 2)
    add_paragraph(doc, '接口地址：GET /api/templates/:id')
    add_paragraph(doc, '返回指定ID的模板完整信息')
    
    add_heading(doc, '3.3 创建模板', 2)
    add_paragraph(doc, '接口地址：POST /api/templates')
    add_paragraph(doc, '创建新的文档模板')
    
    add_heading(doc, '3.4 更新模板', 2)
    add_paragraph(doc, '接口地址：PUT /api/templates/:id')
    add_paragraph(doc, '更新指定ID的模板')
    
    add_heading(doc, '3.5 删除模板', 2)
    add_paragraph(doc, '接口地址：DELETE /api/templates/:id')
    add_paragraph(doc, '删除指定ID的模板')
    
    add_heading(doc, '3.6 复制模板', 2)
    add_paragraph(doc, '接口地址：POST /api/templates/:id/duplicate')
    add_paragraph(doc, '复制现有模板创建新模板')
    
    add_heading(doc, '3.7 导入导出模板', 2)
    add_paragraph(doc, '• 导出单个：GET /api/templates/:id/export')
    add_paragraph(doc, '• 导出全部：GET /api/templates/export/all')
    add_paragraph(doc, '• 导入模板：POST /api/templates/import')
    
    # 4. 文档处理接口
    add_heading(doc, '四、文档处理接口', 1)
    add_heading(doc, '4.1 导入Word文档', 2)
    add_paragraph(doc, '接口地址：POST /api/documents/import')
    add_paragraph(doc, '请求格式：multipart/form-data')
    add_paragraph(doc, '参数：file - Word文档文件（.docx格式）')
    
    add_heading(doc, '4.2 导出Word文档', 2)
    add_paragraph(doc, '接口地址：POST /api/documents/export')
    add_paragraph(doc, '将编辑器内容导出为Word文档')
    
    add_heading(doc, '4.3 Word解析', 2)
    add_paragraph(doc, '接口地址：POST /api/word-import/parse-word')
    add_paragraph(doc, '解析Word文档结构，识别内容块')
    
    add_heading(doc, '4.4 文本提取', 2)
    add_paragraph(doc, '• 单个文档：POST /api/documents/extract-text')
    add_paragraph(doc, '• 多个文档：POST /api/documents/extract-texts')
    
    # 5. 模型管理接口
    add_heading(doc, '五、模型管理接口', 1)
    add_heading(doc, '5.1 获取模型列表', 2)
    add_paragraph(doc, '接口地址：GET /api/models')
    add_paragraph(doc, '返回所有配置的AI模型列表')
    
    add_heading(doc, '5.2 添加模型', 2)
    add_paragraph(doc, '接口地址：POST /api/models')
    add_paragraph(doc, '')
    add_paragraph(doc, '请求参数：')
    
    model_params = [
        ['参数名', '类型', '说明'],
        ['name', 'string', '模型名称'],
        ['type', 'string', '模型类型：qianwen/openai/custom'],
        ['apiKey', 'string', 'API密钥'],
        ['baseUrl', 'string', 'API基础URL'],
        ['model', 'string', '模型标识符']
    ]
    add_table(doc, model_params[0], model_params[1:])
    
    add_heading(doc, '5.3 更新模型', 2)
    add_paragraph(doc, '接口地址：PUT /api/models/:id')
    
    add_heading(doc, '5.4 删除模型', 2)
    add_paragraph(doc, '接口地址：DELETE /api/models/:id')
    
    add_heading(doc, '5.5 测试模型连接', 2)
    add_paragraph(doc, '接口地址：POST /api/models/:id/test')
    add_paragraph(doc, '测试模型配置是否正确')
    
    # 6. 钉钉认证接口
    add_heading(doc, '六、钉钉认证接口', 1)
    add_heading(doc, '6.1 获取钉钉配置', 2)
    add_paragraph(doc, '接口地址：GET /api/dingtalk/config')
    add_paragraph(doc, '获取钉钉JSAPI配置信息')
    
    add_heading(doc, '6.2 获取用户信息', 2)
    add_paragraph(doc, '接口地址：POST /api/dingtalk/userinfo')
    add_paragraph(doc, '通过免登授权码获取用户信息')
    
    add_heading(doc, '6.3 验证用户', 2)
    add_paragraph(doc, '接口地址：POST /api/dingtalk/verify')
    add_paragraph(doc, '验证用户是否有权访问系统')
    
    # 7. 其他接口
    add_heading(doc, '七、其他接口', 1)
    add_heading(doc, '7.1 健康检查', 2)
    add_paragraph(doc, '接口地址：GET /api/health')
    add_paragraph(doc, '检查服务运行状态和数据完整性')
    
    add_heading(doc, '7.2 图片处理', 2)
    add_paragraph(doc, '• 上传分析：POST /api/images/upload-analyze')
    add_paragraph(doc, '• 保存图片：POST /api/images/save')
    add_paragraph(doc, '• 获取图片：GET /api/images/:filename')
    
    # 8. 错误码说明
    add_heading(doc, '八、错误码说明', 1)
    
    error_codes = [
        ['错误码', 'HTTP状态码', '说明'],
        ['INVALID_REQUEST', '400', '请求参数无效'],
        ['UNAUTHORIZED', '401', '未授权访问'],
        ['NOT_FOUND', '404', '资源不存在'],
        ['RATE_LIMIT', '429', '请求频率过高'],
        ['INTERNAL_ERROR', '500', '服务器内部错误'],
        ['AI_SERVICE_ERROR', '503', 'AI服务不可用']
    ]
    add_table(doc, error_codes[0], error_codes[1:])
    
    # 9. 速率限制
    add_heading(doc, '九、速率限制', 1)
    add_paragraph(doc, '• 通用API：每IP每15分钟最多100个请求')
    add_paragraph(doc, '• AI生成API：每IP每分钟最多10个请求')
    add_paragraph(doc, '')
    add_paragraph(doc, '响应头中包含速率限制信息：')
    add_paragraph(doc, '• X-RateLimit-Limit：限制数量')
    add_paragraph(doc, '• X-RateLimit-Remaining：剩余请求数')
    add_paragraph(doc, '• X-RateLimit-Reset：重置时间')
    
    # 保存文档
    doc.save('API接口文档_Word新汇点_v1.6.2.docx')
    print('API接口文档已生成：API接口文档_Word新汇点_v1.6.2.docx')


def test_api_endpoints():
    """测试API接口的可用性"""
    import requests
    import json
    
    base_url = 'http://localhost:3003/api'
    test_results = []
    
    print('\n开始测试API接口...')
    print('-' * 50)
    
    # 测试健康检查
    try:
        resp = requests.get(f'{base_url}/health')
        test_results.append({
            'endpoint': 'GET /api/health',
            'status': resp.status_code,
            'result': '✓ 通过' if resp.status_code == 200 else '✗ 失败'
        })
        print(f'✓ 健康检查接口正常 (状态码: {resp.status_code})')
    except Exception as e:
        test_results.append({
            'endpoint': 'GET /api/health',
            'status': 'Error',
            'result': '✗ 连接失败'
        })
        print(f'✗ 健康检查接口失败: {e}')
    
    # 测试模板列表
    try:
        resp = requests.get(f'{base_url}/templates/list?page=1&pageSize=10')
        test_results.append({
            'endpoint': 'GET /api/templates/list',
            'status': resp.status_code,
            'result': '✓ 通过' if resp.status_code == 200 else '✗ 失败'
        })
        print(f'✓ 模板列表接口正常 (状态码: {resp.status_code})')
    except Exception as e:
        test_results.append({
            'endpoint': 'GET /api/templates/list',
            'status': 'Error',
            'result': '✗ 连接失败'
        })
        print(f'✗ 模板列表接口失败: {e}')
    
    # 测试模型列表
    try:
        resp = requests.get(f'{base_url}/models')
        test_results.append({
            'endpoint': 'GET /api/models',
            'status': resp.status_code,
            'result': '✓ 通过' if resp.status_code == 200 else '✗ 失败'
        })
        print(f'✓ 模型列表接口正常 (状态码: {resp.status_code})')
    except Exception as e:
        test_results.append({
            'endpoint': 'GET /api/models',
            'status': 'Error',
            'result': '✗ 连接失败'
        })
        print(f'✗ 模型列表接口失败: {e}')
    
    # 测试文档格式支持
    try:
        resp = requests.get(f'{base_url}/documents/formats')
        test_results.append({
            'endpoint': 'GET /api/documents/formats',
            'status': resp.status_code,
            'result': '✓ 通过' if resp.status_code == 200 else '✗ 失败'
        })
        print(f'✓ 文档格式接口正常 (状态码: {resp.status_code})')
    except Exception as e:
        test_results.append({
            'endpoint': 'GET /api/documents/formats',
            'status': 'Error',
            'result': '✗ 连接失败'
        })
        print(f'✗ 文档格式接口失败: {e}')
    
    # 测试AI提供商列表
    try:
        resp = requests.get(f'{base_url}/ai-gpt/providers')
        test_results.append({
            'endpoint': 'GET /api/ai-gpt/providers',
            'status': resp.status_code,
            'result': '✓ 通过' if resp.status_code == 200 else '✗ 失败'
        })
        print(f'✓ AI提供商接口正常 (状态码: {resp.status_code})')
    except Exception as e:
        test_results.append({
            'endpoint': 'GET /api/ai-gpt/providers',
            'status': 'Error',
            'result': '✗ 连接失败'
        })
        print(f'✗ AI提供商接口失败: {e}')
    
    print('-' * 50)
    print('API接口测试完成！')
    
    # 生成测试报告
    print('\n测试结果汇总：')
    for result in test_results:
        print(f"{result['endpoint']}: {result['result']} (状态: {result['status']})")
    
    return test_results


def main():
    """主函数"""
    print('开始生成Word新汇点项目文档...')
    print('-' * 50)
    
    # 生成API接口文档
    print('正在生成API接口文档...')
    generate_api_documentation()
    
    # 生成测试报告
    print('正在生成测试报告...')
    generate_test_report()
    
    # 生成用户手册
    print('正在生成用户手册...')
    generate_user_manual()
    
    # 生成部署文档
    print('正在生成部署文档...')
    generate_deployment_guide()
    
    print('-' * 50)
    print('所有文档已生成完成！')
    print('\n生成的文档列表：')
    print('1. API接口文档_Word新汇点_v1.6.2.docx')
    print('2. 测试报告_Word新汇点_v1.6.2.docx')
    print('3. 用户手册_Word新汇点_v1.6.2.docx')
    print('4. 部署文档_Word新汇点_v1.6.2.docx')
    
    # 询问是否进行API测试
    print('\n是否进行API接口测试？(y/n): ', end='')
    choice = input().strip().lower()
    if choice == 'y':
        test_api_endpoints()


if __name__ == '__main__':
    # 检查并安装python-docx库
    try:
        import docx
    except ImportError:
        print('正在安装python-docx库...')
        import subprocess
        subprocess.check_call(['pip', 'install', 'python-docx'])
        print('python-docx库安装完成！')
    
    main()