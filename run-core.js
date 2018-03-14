'use strict'
require('babel-register')
const Wechat = require('./src/wechat.js')
const qrcode = require('qrcode-terminal')
const fs = require('fs')
const request = require('request')
const parser = require('xml2json');
const moment = require('moment');

const cacheDir = 'cache'



function startBot(sessionCacheFile) {

  let bot
  /**
   * 尝试获取本地登录数据，免扫码
   * 这里从本地文件中获取数据
   */

  if (sessionCacheFile) {
    try {
      bot = new Wechat(require(sessionCacheFile))
    } catch (e) {
      console.log(e)
      bot = new Wechat()
    }
  } else
    bot = new Wechat()



  /**
   * uuid事件，参数为uuid，根据uuid生成二维码
   */
  bot.on('uuid', uuid => {
    qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
      //small: true
    })
    console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
  })


  /**
   * 登录用户头像事件，手机扫描后可以得到登录用户头像的Data URL
   */
  bot.on('user-avatar', avatar => {
    console.log('登录用户头像Data URL：', avatar)
  })


  /**
   * 登录成功事件
   */
  bot.on('login', () => {
    console.log(`${bot.user.NickName} 登录成功`)
    // 保存数据，将数据序列化之后保存到任意位置
    fs.writeFileSync(`./${cacheDir}/${bot.user.UserName}.json`, JSON.stringify(bot.botData))
  })


  /**
   * 登出成功事件
   */
  bot.on('logout', () => {
    console.log(`bot账户[${bot.user.NickName}] 登出成功`)
    // 清除数据
    fs.unlinkSync(`./${cacheDir}/${bot.user.UserName}.json`)
  })
  /**
   * 联系人更新事件，参数为被更新的联系人列表
  
  bot.on('contacts-updated', contacts => {
    console.log("--------contacts-updated--------"); //contacts
    console.log('联系人数量：', Object.keys(bot.contacts).length);
    //console.dir(contacts);
  
    for (var k in contacts) {
      let contact = contacts[k];
      console.log(`----${k}----`);
      for (var i in contact) {
        if (contact[i]) {
          if ("object" == typeof(contact[i])) {
            if ("undefined" != contact[i].length) {
              if (contact[i].length > 0)
                console.log(`\t${i}:\t[...]`);
            } else
              console.log(`\t${i}:\t{...}`);
          } else if ("function" == typeof(contact[i])) {
            //console.log(`\t${i}:\t{...}`);
          } else
            console.log(`\t${i}:\t${contact[i]}`);
        }
      }
    }
  
  })
   */


  /**
   * 错误事件，参数一般为Error对象
   */
  bot.on('error', err => {
    console.error('错误：', err)
  })
  /**
   * 如何发送消息
   */
  bot.on('login', () => {
    console.log('--------------------')
    console.log(`登录者id：\t${bot.user.UserName}`)
    console.log(`登录者昵称：\t${bot.user.NickName}`)
    console.log('--------------------')

    /**
     * 演示发送消息到文件传输助手
     * 通常回复消息时可以用 msg.FromUserName
     */
    let ToUserName = 'filehelper'

    /**
     * 发送文本消息，可以包含emoji(😒)和QQ表情([坏笑])
     */
    bot.sendMsg('发送文本消息，可以包含emoji(😒)和QQ表情([坏笑]) https://github.com/nodeWechat/wechat4u/issues/249', ToUserName)
      .catch(err => {
        bot.emit('error', err)
      })

    /**
     * 通过表情MD5发送表情
     */
    bot.sendMsg({
        emoticonMd5: '00c801cdf69127550d93ca52c3f853ff'
      }, ToUserName)
      .catch(err => {
        bot.emit('error', err)
      })

    /**
     * 以下通过上传文件发送图片，视频，附件等
     * 通用方法为入下
     * file为多种类型
     * filename必填，主要为了判断文件类型
     */
    // bot.sendMsg({
    //   file: Stream || Buffer || ArrayBuffer || File || Blob,
    //   filename: 'bot-qrcode.jpg'
    // }, ToUserName)
    //   .catch(err => {
    //     bot.emit('error',err)
    //   })

    /**
     * 发送图片
  
    bot.sendMsg({
        file: request('https://raw.githubusercontent.com/nodeWechat/wechat4u/master/bot-qrcode.jpg'),
        filename: 'bot-qrcode.jpg'
      }, ToUserName)
      .catch(err => {
        bot.emit('error', err)
      })
     */


    /**
     * 发送表情
  
    bot.sendMsg({
      file: fs.createReadStream('./media/test.gif'),
      filename: 'test.gif'
    }, ToUserName)
      .catch(err => {
        bot.emit('error', err)
      })
     */
    /**
     * 发送视频
  
    bot.sendMsg({
      file: fs.createReadStream('./media/test.mp4'),
      filename: 'test.mp4'
    }, ToUserName)
      .catch(err => {
        bot.emit('error', err)
      })
     */
    /**
     * 发送文件
  
    bot.sendMsg({
      file: fs.createReadStream('./media/test.txt'),
      filename: 'test.txt'
    }, ToUserName)
      .catch(err => {
        bot.emit('error', err)
      })
     */
    /**
     * 发送撤回消息请求
  
    bot.sendMsg('测试撤回', ToUserName)
      .then(res => {
        // 需要取得待撤回消息的MsgID
        return bot.revokeMsg(res.MsgID, ToUserName)
      })
      .catch(err => {
        console.log(err)
      })
     */



  })



  /**
   * 如何处理会话消息
   */
  bot.on('message', msg => {
    /**
     * 获取消息时间
     */
    console.log(`-----${bot.user.NickName}----- MSG !! ${msg.getDisplayTime()}----------`)
    console.log(`[${moment().format("YYYY/MM/DD HH:mm:ss")}]`);
    /**
     * 获取消息发送者的显示名
     */
    let from = msg.FromUserName,
      from_name = bot.contacts[from].getDisplayName();
    let to = msg.ToUserName,
      to_name = bot.contacts[to].getDisplayName();

    console.log(`${from_name.slice(0, 4)}(${from.slice(0, 4)}) =====> ${to_name.slice(0, 4)}(${to.slice(0, 4)})，消息类型是：${msg.MsgType}`)

    //    if (msg.StatusNotifyUserName)
    //      console.log(`StatusNotifyUserName: ${msg.StatusNotifyUserName} `);
    /**
     * 判断消息类型
     */
    switch (msg.MsgType) {
      case bot.CONF.MSGTYPE_TEXT:
        /**
         * 文本消息
         */


        console.log(msg.Content)
        if ("一一" == bot.contacts[msg.FromUserName].getDisplayName()) {
          /*
          bot.contacts 说明：
  
          '@@18166caf1b45de331ae5c4cedeb9497fc3d5078a6a58e6791473e66f77a14a14':
             { Uin: 0,
               UserName: '@@18166caf1b45de331ae5c4cedeb9497fc3d5078a6a58e6791473e66f77a14a14',
               NickName: 'Luat开源模块扯淡群',
               HeadImgUrl: '/cgi-bin/mmwebwx-bin/webwxgetheadimg?seq=689628946&username=@@18166caf1b45de331ae5c4cedeb9497fc3d5078a6a58e6791473e66f77a14a14&skey=',
               ContactFlag: 2,
               MemberCount: 104,
               MemberList:[]}
  
          */
          bot.informer = msg.FromUserName;

          bot.sendMsg('我，还活着', msg.FromUserName)
            .catch(err => {
              bot.emit('error', err)
            })

          if (msg.Content == "联系人") {
            for (var p in bot.contacts) {
              console.log(`${bot.contacts[p].getDisplayName()}  -->  ${p}`);
            }
          }
        } else if ("凹凸波特" == bot.contacts[msg.FromUserName].getDisplayName()) {
          console.log('----- 凹凸波特 -----')
          console.log(`凹凸波特 的临时id是：${msg.FromUserName}`)
          console.log('----- end -----')

        }

        break
      case bot.CONF.MSGTYPE_IMAGE:
        /**
         * 图片消息
         */
        console.log('图片消息，保存到本地')
        if ("一一" == bot.contacts[msg.FromUserName].getDisplayName()) {
          bot.getMsgImg(msg.MsgId).then(res => {
            fs.writeFileSync(`./media/${msg.MsgId}.jpg`, res.data)
          }).catch(err => {
            bot.emit('error', err)
          })
        }
        break
      case bot.CONF.MSGTYPE_VOICE:
        /**
         * 语音消息
         */
        console.log('语音消息，保存到本地')
        if ("一一" == bot.contacts[msg.FromUserName].getDisplayName()) {
          bot.getVoice(msg.MsgId).then(res => {
            fs.writeFileSync(`./media/${msg.MsgId}.mp3`, res.data)
          }).catch(err => {
            bot.emit('error', err)
          })
        }
        /*
  
        */
        break
      case bot.CONF.MSGTYPE_EMOTICON:
        /**
         * 表情消息
         */
        console.log('表情消息，保存到本地')
        /*
              bot.getMsgImg(msg.MsgId).then(res => {
                fs.writeFileSync(`./media/${msg.MsgId}.gif`, res.data)
              }).catch(err => {
                bot.emit('error', err)
              })
        */
        break
      case bot.CONF.MSGTYPE_VIDEO:
      case bot.CONF.MSGTYPE_MICROVIDEO:
        /**
         * 视频消息
         */
        console.log('视频消息，保存到本地')
        if ("一一" == bot.contacts[msg.FromUserName].getDisplayName()) {

          bot.getVideo(msg.MsgId).then(res => {
            fs.writeFileSync(`./media/${msg.MsgId}.mp4`, res.data)
          }).catch(err => {
            bot.emit('error', err)
          })
        }
        break
      case bot.CONF.MSGTYPE_APP:
        if (msg.AppMsgType == bot.CONF.APPMSGTYPE_ATTACH) {
          /**
           * 文件消息
           */
          console.log('文件消息，保存到本地')
          if ("一一" == bot.contacts[msg.FromUserName].getDisplayName()) {
            bot.getDoc(msg.FromUserName, msg.MediaId, msg.FileName).then(res => {
              fs.writeFileSync(`./media/${msg.FileName}`, res.data)
              console.log(res.type);
            }).catch(err => {
              bot.emit('error', err)
            })
          }

          /*
           */
        } else if (msg.AppMsgType == bot.CONF.APPMSGTYPE_TRANSFERS) {
          console.log("收到转账");

          try {
            var detail = JSON.parse(parser.toJson(msg.Content));
            console.dir(detail.msg.wcpayinfo);
          } catch (err) {
            console.log("-------------content-------------");
            console.log(`${msg.Content}`);
          }

        } else if (msg.AppMsgType == bot.CONF.APPMSGTYPE_URL) {
          console.log("AppMsgType: APPMSGTYPE_URL 类型");

          try {
            var detail = JSON.parse(parser.toJson(msg.Content));
            console.log("-------------title-------------");
            console.log(detail.msg.appmsg.title);
            console.log("-------------des-------------");
            console.log(detail.msg.appmsg.des);
            console.log("-------------url-------------");
            console.log(detail.msg.appmsg.url);
          } catch (err) {
            console.log("-------------content-------------");
            console.log(`${msg.Content}`);
          }

          if ("微信支付" == bot.contacts[msg.FromUserName].getDisplayName()) {
            console.log("二维码收款到账");

            if (bot.informer) {
              bot.sendMsg('嘿嘿，收到钱啦 ' + detail.msg.appmsg.des, bot.informer)
                .catch(err => {
                  bot.emit('error', err)
                })
            }
          }

        } else {
          console.log("不认识的APP类型，内部是啥？");
          //console.dir(msg)
        }
        break


      case bot.CONF.MSGTYPE_VERIFYMSG:
        console.log('------------- new buddy -------------')
        console.log("UserName:" + msg.RecommendInfo.UserName)
        console.log("Ticket:" + msg.RecommendInfo.Ticket)
        console.dir(msg.RecommendInfo)
        /*
  { UserName: '@10f08288bd8694e00086f69d2a1b2249434283338a85a6845b41413713f299e8',
    NickName: '比由比由',
    QQNum: 0,
    Province: '',
    City: '',
    Content: '我你都黑？？',  <--- 请求信息
    Signature: '',
    Alias: '',
    Scene: 6,
    VerifyFlag: 0,
    AttrStatus: 235813,
    Sex: 0,
    Ticket: 'xx@stranger',
    OpCode: 2 }
        */
        console.log('------------- buddy end -------------')
        break

      default:
        console.log(`MSGTYPE_APP这个类型AppMsgType(${msg.AppMsgType})没法憨豆唉~~~内部是啥？`);
        //console.dir(msg)
        console.log("-------------content-------------");
        console.log(`${msg.Content}`);
        break
    }

  })
  /**
   * 如何处理红包消息

  bot.on('message', msg => {
    if (msg.MsgType == bot.CONF.MSGTYPE_SYS && /红包/.test(msg.Content)) {
      // 若系统消息中带有‘红包’，则认为是红包消息
      // wechat4u并不能自动收红包
      console.log("收到红包");
    }
  })
   */

  /**
   * 如何处理撤回消息

  bot.on('message', msg => {
    if (msg.MsgType == bot.CONF.MSGTYPE_RECALLED) {
      // msg.Content是一个xml，关键信息是MsgId
      let MsgId = msg.Content.match(/<msgid>(.*?)<\/msgid>.*?<replacemsg><!\[CDATA\[(.*?)\]\]><\/replacemsg>/)[0]
      // 得到MsgId后，根据MsgId，从收到过的消息中查找被撤回的消息
    }
  })
   */

  /**
   * 如何处理好友请求消息

  bot.on('message', msg => {
    if (msg.MsgType == bot.CONF.MSGTYPE_VERIFYMSG) {
      bot.verifyUser(msg.RecommendInfo.UserName, msg.RecommendInfo.Ticket)
        .then(res => {
          console.log(`通过了 ${bot.Contact.getDisplayName(msg.RecommendInfo)} 好友请求`)
        })
        .catch(err => {
          bot.emit('error', err)
        })
    }
  })
   */



  /**
   * 如何直接转发消息

  bot.on('message', msg => {
    // 不是所有消息都可以直接转发
    bot.forwardMsg(msg, 'filehelper')
      .catch(err => {
        bot.emit('error', err)
      })
  })

   */


  /**
   * 如何获取联系人头像

  bot.on('message', msg => {

      bot.getHeadImg(bot.contacts[msg.FromUserName].HeadImgUrl).then(res => {
        fs.writeFileSync(`./media/${msg.FromUserName}.jpg`, res.data)
      }).catch(err => {
        bot.emit('error', err)
      })
  })
   */



  /**
   * 启动机器人
   */
  if (bot.PROP.uin) {
    // 存在登录数据时，可以随时调用restart进行重启
    return bot.restart()
  } else {
    return bot.start()
  }

  
}


let startJob = []
let caches = fs.readdirSync(`./${cacheDir}`)
if (caches){
  caches.forEach(function (file, index) {
    if (file.endsWith('.json')){
      console.log(`Found cache file: ${file}, restoring...`)
      startJob.push(startBot(`./${cacheDir}/${file}`))
    }
  })
}


if(startJob.length > 0)
  Promise.all(startJob).catch(e => {
    console.log(`-------catch1-------`)
    debug(e)
  })
else{
  startBot()
  .then(()=>{
    return startBot()
  })
  .catch(e => {
    console.log(`-------catch2-------`)
    debug(e)
  })
  

}

