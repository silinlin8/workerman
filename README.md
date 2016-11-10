基于workerman开发的简单聊天室

代码位于 chat

php -d index.php start

redis做聊天缓存服务器

json格式发送数据

{
	"type":"text"/"image".....,
	"data":数据,
	"from":来自,
	"to":发送至,
	"time":时间


}