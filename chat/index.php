<?php
use Workerman\Connection\AsyncTcpConnection;
use Workerman\Worker;
use Workerman\Lib\Timer;
require_once __DIR__.'/../Autoloader.php';
require_once './message.php';
require_once './system.php';

$worker = new Worker('websocket://0.0.0.0:2345');
$worker->fd = array(); //连接的客户端
//$worker->count = 4;
$worker->onlineuser = 0;
$message = new Message();
$worker->message = $message;
$redis = new Redis();
$redis->connect('127.0.0.1',6379);
$worker->redis = $redis;
$worker->system = new System();
$worker->onWorkerStart = function($worker){
	
	if($worker->id == 0){
		Timer::add(6*3600,array($worker->system,'deleteUser',array($worker)));
	}
	
	echo 'success'."\n";
	echo $worker->redis->ping();

};
$worker->onConnect = function($connection) use($worker){
	$msg = $worker->message->getUsers($worker);
	$connection->send($msg);
};
$worker->onMessage = function($connection,$data) use($worker){

	$data = $worker->message->msg(json_decode($data,true),$connection,$worker);//$worker->redis->get('id')
	//echo $connection->id;
	if($data)
		$connection->send($data);
};

$worker->onClose = function($connection) use($worker){
	
	$worker->fd[$connection->id]['status'] = 0;
	$worker->onlineuser--;
	$worker->message->sendUsers($worker,$connection);
	echo $connection->id.'closed'."\n";
};

Worker::runAll();