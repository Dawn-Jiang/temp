#!/bin/bash

# 智慧医疗挂号平台 - 生产环境部署脚本
# 使用方法: ./deploy.sh {start|stop|restart|status}

APP_NAME="registration-backend"
APP_JAR="target/${APP_NAME}-1.0.0.jar"
LOG_DIR="/var/log/hospital"
LOG_FILE="${LOG_DIR}/${APP_NAME}.log"
PID_FILE="/var/run/${APP_NAME}.pid"

# JVM参数
JVM_OPTS="-Xms512m -Xmx1024m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=${LOG_DIR}"

start() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "$APP_NAME 已在运行中 (PID: $(cat $PID_FILE))"
        return 1
    fi

    echo "正在启动 $APP_NAME ..."
    mkdir -p "$LOG_DIR"

    nohup java $JVM_OPTS -jar "$APP_JAR" \
        --spring.profiles.active=prod \
        >> "$LOG_FILE" 2>&1 &

    echo $! > "$PID_FILE"
    echo "$APP_NAME 启动成功 (PID: $(cat $PID_FILE))"
}

stop() {
    if [ ! -f "$PID_FILE" ] || ! kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "$APP_NAME 未运行"
        return 1
    fi

    echo "正在停止 $APP_NAME (PID: $(cat $PID_FILE)) ..."
    kill -15 $(cat "$PID_FILE")
    sleep 5

    # 强制停止
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "强制停止 $APP_NAME ..."
        kill -9 $(cat "$PID_FILE")
    fi

    rm -f "$PID_FILE"
    echo "$APP_NAME 已停止"
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "$APP_NAME 运行中 (PID: $(cat $PID_FILE))"
    else
        echo "$APP_NAME 未运行"
    fi
}

restart() {
    stop
    sleep 2
    start
}

case "$1" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0