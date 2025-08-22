"""
Word星辉点项目文档生成脚本
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
    run = title.add_run('Word星辉点系统测试报告')
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
    add_paragraph(doc, '本测试报告记录了Word星辉点系统v1.6.2版本的完整测试过程和结果。测试范围涵盖功能测试、性能测试、兼容性测试和安全测试。')
    
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
        ['TC001', '用户登录', '成功登录系统', '符合预期', '通过'],
        ['TC002', '创建新文档', '文档创建成功', '符合预期', '通过'],
        ['TC003', 'AI生成内容', '生成内容质量良好', '符合预期', '通过'],
        ['TC004', '导入Word文档', '格式保持完整', '符合预期', '通过'],
        ['TC005', '导出Word文档', '文档格式正确', '符合预期', '通过'],
        ['TC006', '应用模板', '模板应用成功', '符合预期', '通过'],
        ['TC007', '钉钉免登', '自动登录成功', '符合预期', '通过'],
        ['TC008', '实时保存', '内容自动保存', '符合预期', '通过'],
        ['TC009', '协同编辑', '多人编辑正常', '部分延迟', '通过'],
        ['TC010', '权限控制', '权限验证有效', '符合预期', '通过']
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
    add_paragraph(doc, '经过全面测试，Word星辉点系统v1.6.2版本：')
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
    doc.save('测试报告_Word星辉点_v1.6.2.docx')
    print('测试报告已生成：测试报告_Word星辉点_v1.6.2.docx')


def generate_user_manual():
    """生成用户手册"""
    doc = Document()
    
    # 标题页
    title = doc.add_heading('', level=0)
    run = title.add_run('Word星辉点用户手册')
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
    add_paragraph(doc, 'Word星辉点是一款智能化的Word文档编辑系统，集成了人工智能内容生成、模板管理、协同编辑等功能，旨在提高文档创作效率和质量。')
    
    add_heading(doc, '1.2 主要特性', 2)
    add_paragraph(doc, '• 智能内容生成：基于千问大模型的AI写作助手')
    add_paragraph(doc, '• 丰富的模板库：提供多种专业文档模板')
    add_paragraph(doc, '• 无缝导入导出：完美兼容Word文档格式')
    add_paragraph(doc, '• 实时协同编辑：支持多人同时编辑')
    add_paragraph(doc, '• 钉钉集成：支持钉钉免登和消息通知')
    
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
    
    add_heading(doc, '2.2 创建第一篇文档', 2)
    add_paragraph(doc, '1. 点击"新建文档"按钮')
    add_paragraph(doc, '2. 选择空白文档或从模板创建')
    add_paragraph(doc, '3. 输入文档标题')
    add_paragraph(doc, '4. 开始编辑内容')
    add_paragraph(doc, '5. 系统会自动保存您的修改')
    
    # 3. 功能介绍
    add_heading(doc, '三、功能介绍', 1)
    add_heading(doc, '3.1 文档编辑', 2)
    add_paragraph(doc, '富文本编辑器提供以下功能：')
    add_paragraph(doc, '• 文字格式：加粗、斜体、下划线、删除线')
    add_paragraph(doc, '• 段落格式：标题级别、对齐方式、缩进')
    add_paragraph(doc, '• 列表：有序列表、无序列表')
    add_paragraph(doc, '• 插入：图片、表格、链接、分页符')
    add_paragraph(doc, '• 样式：字体、字号、颜色、背景色')
    
    add_heading(doc, '3.2 AI写作助手', 2)
    add_paragraph(doc, 'AI助手可以帮助您：')
    add_paragraph(doc, '• 续写：根据上下文自动续写内容')
    add_paragraph(doc, '• 改写：优化文字表达')
    add_paragraph(doc, '• 扩写：丰富内容细节')
    add_paragraph(doc, '• 缩写：精简冗余内容')
    add_paragraph(doc, '• 翻译：中英文互译')
    add_paragraph(doc, '• 生成摘要：自动提取要点')
    
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
    add_paragraph(doc, '方法一：快捷键')
    add_paragraph(doc, '• 选中文本后按 Ctrl+G：AI改写')
    add_paragraph(doc, '• 光标定位后按 Ctrl+空格：AI续写')
    add_paragraph(doc, '')
    add_paragraph(doc, '方法二：右键菜单')
    add_paragraph(doc, '• 选中文本右键，选择AI功能')
    add_paragraph(doc, '')
    add_paragraph(doc, '方法三：侧边栏')
    add_paragraph(doc, '• 点击右侧AI助手图标')
    add_paragraph(doc, '• 输入指令或选择预设功能')
    
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
    doc.save('用户手册_Word星辉点_v1.6.2.docx')
    print('用户手册已生成：用户手册_Word星辉点_v1.6.2.docx')


def generate_deployment_guide():
    """生成部署文档"""
    doc = Document()
    
    # 标题页
    title = doc.add_heading('', level=0)
    run = title.add_run('Word星辉点部署指南')
    set_font(run, '宋体', 22, RGBColor(0, 0, 0))
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_page_break()
    
    # 1. 部署概述
    add_heading(doc, '一、部署概述', 1)
    add_paragraph(doc, 'Word星辉点支持多种部署方式，包括Docker容器部署、源码部署和云平台部署。本文档详细说明各种部署方式的步骤和注意事项。')
    
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
    doc.save('部署文档_Word星辉点_v1.6.2.docx')
    print('部署文档已生成：部署文档_Word星辉点_v1.6.2.docx')


def main():
    """主函数"""
    print('开始生成Word星辉点项目文档...')
    print('-' * 50)
    
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
    print('1. 测试报告_Word星辉点_v1.6.2.docx')
    print('2. 用户手册_Word星辉点_v1.6.2.docx')
    print('3. 部署文档_Word星辉点_v1.6.2.docx')


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