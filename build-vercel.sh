#!/bin/bash
# 安装 node-canvas 所需的系统依赖 (Amazon Linux 2)
# 包含 cairo, pango, jpeg, gif, 和 pixman
yum install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel pixman-devel