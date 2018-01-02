/**
 * Created by Administrator on 2018/1/2.
 */
//初始化环信连接
/*回调函数实现的功能*/
var conn = new WebIM.connection({
    https: WebIM.config.https,
    // https: typeof WebIM.config.https === 'boolean' ? WebIM.config.https : location.protocol === 'https:',
    url: WebIM.config.xmppURL,
    apiUrl: WebIM.config.apiURL,
    isAutoLogin: WebIM.config.isAutoLogin,
    isMultiLoginSessions: WebIM.config.isMultiLoginSessions
    // heartBeatWait: WebIM.config.heartBeatWait,
    // autoReconnectNumMax: WebIM.config.autoReconnectNumMax,
    // autoReconnectInterval: WebIM.config.autoReconnectInterval
});// 创建连接
conn.listen({
    onOpened: function (message) { //连接成功回调
        // 如果isAutoLogin设置为false，那么必须手动设置上线，否则无法收消息
        // 手动上线指的是调用conn.setPresence(); 如果conn初始化时已将isAutoLogin设置为true
        // 则无需调用conn.setPresence();
        // 连接成功才可以发送消息
        console.log("%c [opened] 连接已成功建立", "color: green");
        handleOpen(conn);

    },
    onClosed: function (message) {
    }, //连接关闭回调
    onTextMessage: function (message) {
        // 在此接收和处理消息，根据message.type区分消息来源，私聊或群组或聊天室
        handleTextMessage(message);
    }, //收到文本消息
    onEmojiMessage: function (message) {
        // 当为WebIM添加了Emoji属性后，若发送的消息含WebIM.Emoji里特定的字符串，connection就会自动将
        // 这些字符串和其它文字按顺序组合成一个数组，每一个数组元素的结构为{type: 'emoji(或者txt)', data:''}
        // 当type='emoji'时，data表示表情图像的路径，当type='txt'时，data表示文本消息
        console.log('表情');
        var data = message.data;
        for (var i = 0, l = data.length; i < l; i++) {
            console.log(data[i]);
        }
    }, //收到表情消息
    onPictureMessage: function (message) {
        console.log('图片');
        var options = {
            url: message.url
        };
        options.onFileDownloadComplete = function () {
            // 图片下载成功
            var msgObjDivId = null;
            var listObjIId = null;
            if (message.type == "chat") {
                msgObjDivId = "ChatRosters-" + message.from;
                listObjIId = "ListRosters-" + message.from;
            } else if (message.type == "groupchat") {
                msgObjDivId = "ChatGroups-" + message.to;
                listObjIId = "ListGroups-" + message.to;
            }
            // 把接受的消息添加进消息盒子中
            var chatdiv = $('<div>').attr({
                'class': 'otherMsg'
            });
            $('<img>').attr({
                'src': './demo/img/bb.jpg',
                'width': '40px',
                'height': '40px',
                'id': 'limg'
            }).appendTo(chatdiv);
            console.log(message);
            $('<h4>').text(message.from).appendTo(chatdiv);
            var span = $('<span>').appendTo(chatdiv);
            $('<img>').attr({
                'src': message.url,
                'width': '300px',
            }).appendTo(span);
            $('#' + msgObjDivId).append(chatdiv);
            setTimeout(function () {
                scrollBottom('#' + msgObjDivId);
            }, 500);

            // 小红点添加
            if (curAcceptMsgObjDivId == null || msgObjDivId != curAcceptMsgObjDivId) {
                if (msgObjDivId in redPCache) {
                    var redIVal = $("#" + listObjIId + " i").text();
                    redIVal = parseInt(redIVal) + 1;
                    $("#" + listObjIId + " i").text(redIVal);
                } else {
                    var redI = $('<i>').attr({
                        "id": "redP-" + msgObjDivId
                    }).text(1);
                    $("#" + listObjIId).append(redI);
                    redPCache[msgObjDivId] = true;
                }
                ;
            }
            console.log('图片下载成功!');
            console.log(message);


        };
        options.onFileDownloadError = function () {
            // 图片下载失败
            console.log('图片下载失败!');
        };
        WebIM.utils.download.call(conn, options); // 意义待查
    }, //收到图片消息
    onCmdMessage: function (message) {
        console.log('收到命令消息');
    }, //收到命令消息
    onAudioMessage: function (message) {
        console.log("收到音频消息");
    }, //收到音频消息
    onLocationMessage: function (message) {
        console.log("收到位置消息");
    }, //收到位置消息
    onFileMessage: function (message) {
        console.log("收到文件消息");
    }, //收到文件消息
    onVideoMessage: function (message) {
        var node = document.getElementById('privateVideo');
        var option = {
            url: message.url,
            headers: {
                'Accept': 'audio/mp4'
            },
            onFileDownloadComplete: function (response) {
                var objectURL = WebIM.utils.parseDownloadResponse.call(conn, response);
                node.src = objectURL;
            },
            onFileDownloadError: function () {
                console.log('文件下载失败.')
            }
        };
        WebIM.utils.download.call(conn, option);
    }, //收到视频消息
    onPresence: function (message) {
        handlePresence(message);
    }, //处理“广播”或“发布-订阅”消息，如联系人订阅请求、处理群组、聊天室被踢解散等消息
    onRoster: function (message) {
        console.log('处理好友申请');
    }, //处理好友申请
    onInviteMessage: function (message) {
        console.log('处理群组邀请');
    }, //处理群组邀请
    onOnline: function () {
        console.log('本机网络连接成功');
    }, //本机网络连接成功
    onOffline: function () {
        console.log('本机网络掉线');
    }, //本机网络掉线
    onError: function (message) {
        console.log('失败回调');
        console.log(message);
        $(mainPage).addClass("hide");
        $(loginPage).removeClass("hide");
        if (message && message.type == 1) {
            console.warn('连接建立失败！请确认您的登录账号是否和appKey匹配。')
        }
    }, //失败回调
    onBlacklistUpdate: function (list) { //黑名单变动
        // 查询黑名单，将好友拉黑，将好友从黑名单移除都会回调这个函数，list则是黑名单现有的所有好友信息
        console.log(list);
    },
    onReceivedMessage: function (message) {

    }, //收到消息送达客户端回执
    // onDeliveredMessage: funciton(message){},   //收到消息送达服务器回执
    onReadMessage: function (message) {
    }, //收到消息已读回执
    onCreateGroup: function (message) {
    }, //创建群组成功回执（需调用createGroupNew）
    onMutedMessage: function (message) {
    } //如果用户在A群组被禁言，在A群发消息会走这个回调并且消息不会传递给群其它成员
    // onBlacklistUpdate: function (list) {
    //     // 查询黑名单，将好友拉黑，将好友从黑名单移除都会回调这个函数，list则是黑名单现有的所有好友信息
    //     console.log(list);
    // }     // 黑名单变动
});




