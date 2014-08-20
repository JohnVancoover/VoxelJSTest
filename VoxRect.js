'use strict';

var VoxConf = require(__dirname + '/VoxConf.js')();

var NodeRect = require(__dirname + '/NodeRect.js')();

var Node = NodeRect.Node;
var Aws = NodeRect.Aws;
var Casable = NodeRect.Casable;
var Express = NodeRect.Express;
var Geoip = NodeRect.Geoip;
var Hypertextmin = NodeRect.Hypertextmin;
var Mime = NodeRect.Mime;
var Mongo = NodeRect.Mongo;
var Mustache = NodeRect.Mustache;
var Phantom = NodeRect.Phantom;
var Recaptcha = NodeRect.Recaptcha;
var Socket = NodeRect.Socket;
var Sqlite = NodeRect.Sqlite;
var Xml = NodeRect.Xml;

{
	Express.serverHandle.get('/', function(requestHandle, responseHandle) {
		responseHandle.status(302);
		
		responseHandle.set({
			'Location': '/index.html'
		});
		
		responseHandle.end();
	});
	
	Express.serverHandle.get('/index.html', function(requestHandle, responseHandle) {
		var Mustache_objectHandle = {
			'objectMain': {
				'strRandom': Node.hashbase(Node.cryptoHandle.randomBytes(64)).substr(0, 32)
			},
			'objectGameserver': {
				'intLoginPassword': Gameserver.intLoginPassword,
				'strLoginMotd': Gameserver.strLoginMotd
			}
		};
		
		var FilesystemRead_bufferHandle = null;
		
		var functionFilesystemRead = function() {
			Node.fsHandle.readFile(__dirname + '/assets/index.html', function(errorHandle, bufferHandle) {
				if (errorHandle !== null) {
					responseHandle.end();
					
					return;
				}
				
				{
					FilesystemRead_bufferHandle = bufferHandle;
				}
				
				functionSuccess();
			});
		};
		
		var functionSuccess = function() {
			var strData = FilesystemRead_bufferHandle.toString();

			{
				strData = Mustache.mustacheHandle.render(strData, Mustache_objectHandle);
				
				strData = Mustache.mustacheHandle.render(strData, Mustache_objectHandle);
			}
			
			{
				strData = Hypertextmin.hypertextminHandle.minify(strData, {
					'removeComments': true,
					'removeCommentsFromCDATA': true,
					'removeCDATASectionsFromCDATA': false,
					'collapseWhitespace': true,
					'conservativeCollapse': true,
					'collapseBooleanAttributes': false,
					'removeAttributeQuotes': false,
					'removeRedundantAttributes': false,
					'useShortDoctype': false,
					'removeEmptyAttributes': false,
					'removeOptionalTags': false,
					'removeEmptyElements': false
				});
			}
			
			responseHandle.status(200);
			
			responseHandle.set({
				'Content-Length': Buffer.byteLength(strData, 'utf-8'),
				'Content-Type': Mime.mimeHandle.lookup('html'),
				'Content-Disposition': 'inline; filename="' + requestHandle.path.substr(requestHandle.path.lastIndexOf('/') + 1) + '";'
			});
			
			responseHandle.write(strData);
			
			responseHandle.end();
		};
		
		functionFilesystemRead();
	});
	
	Express.serverHandle.use('/', Express.expressHandle.static(__dirname + '/assets'));
}

{
	Socket.serverHandle.on('connection', function(socketHandle) {
		{
			socketHandle.strIdent = socketHandle.id.substr(1, 8);
		}
		
		{
			var strIdent = socketHandle.strIdent;
			
			Player.playerHandle[strIdent] = {
				'strIdent': strIdent,
				'strTeam': 'teamLogin',
				'strItem': '',
				'strName': '',
				'intScore': 0,
				'intKills': 0,
				'intDeaths': 0,
				'intHealth': 0,
				'dblPosition': [ 0.0, 0.0, 0.0 ],
				'dblVerlet': [ 0.0, 0.0, 0.0 ],
				'dblAcceleration': [ 0.0, 0.0, 0.0 ],
				'dblRotation': [ 0.0, 0.0, 0.0 ],
				'intJumpcount': 0,
				'intInteractionWalk': 0,
				'intInteractionWeapon': 0
			};
		}
		
		{
			Player.playerHandle[socketHandle.strIdent].socketHandle = socketHandle;
		}
		
		{
			socketHandle.emit('loginHandle', {
				'strType': 'typeReject',
				'strMessage': ''
			});
		}
		
		{
			socketHandle.on('loginHandle', function(jsonHandle) {
				if (jsonHandle.strName === undefined) {
					return;
					
				} else if (jsonHandle.strPassword === undefined) {
					return;
					
				} else if (jsonHandle.strTeam === undefined) {
					return;
					
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam !== 'teamLogin') {
					return;
					
				} else if (jsonHandle.strTeam.match(new RegExp('(teamRed)|(teamBlue)', 'g')) === null) {
					return;
					
				}
				
				{
					if (Gameserver.intPlayerActive === Gameserver.intPlayerCapacity) {
						socketHandle.emit('loginHandle', {
							'strType': 'typeReject',
							'strMessage': 'server full'
						});
						
						return;
						
					} else if (jsonHandle.strName === '') {
						socketHandle.emit('loginHandle', {
							'strType': 'typeReject',
							'strMessage': 'name invalid'
						});
						
						return;
						
					} else if (jsonHandle.strPassword !== Gameserver.strLoginPassword) {
						socketHandle.emit('loginHandle', {
							'strType': 'typeReject',
							'strMessage': 'password wrong'
						});
						
						return;
						
					}
				}
				
				{
					Player.playerHandle[socketHandle.strIdent].strTeam = jsonHandle.strTeam;
					
					Player.playerHandle[socketHandle.strIdent].strName = jsonHandle.strName;
				}
				
				{
					socketHandle.emit('loginHandle', {
						'strType': 'typeAccept',
						'strMessage': ''
					});
				}
				
				{
					socketHandle.emit('worldHandle', {
						'strWorld': World.save()
					});
				}
				
				{
					Gameserver.playerRespawn(Player.playerHandle[socketHandle.strIdent]);
				}
			});
			
			socketHandle.on('pingHandle', function(jsonHandle) {
				if (jsonHandle.intTimestamp === undefined) {
					return;
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam === 'teamLogin') {
					return;
					
				}
				
				{
					socketHandle.emit('pingHandle', {
						'strPhaseActive': Gameserver.strPhaseActive,
						'intPhaseRound': Gameserver.intPhaseRound,
						'intPhaseRemaining': Gameserver.intPhaseRemaining,
						'strWorldAvailable': Gameserver.strWorldAvailable,
						'strWorldActive': Gameserver.strWorldActive,
						'intPlayerActive': Gameserver.intPlayerActive,
						'intPlayerCapacity': Gameserver.intPlayerCapacity,
						'intScoreRed': Gameserver.intScoreRed,
						'intScoreBlue': Gameserver.intScoreBlue
					});
				}
			});
			
			socketHandle.on('chatHandle', function(jsonHandle) {
				if (jsonHandle.strMessage === undefined) {
					return;
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam === 'teamLogin') {
					return;
					
				} else if (jsonHandle.strMessage === '') {
					return;
					
				}
				
				{
					var strMessage = jsonHandle.strMessage;
					
					{
						if (strMessage.length > 140) {
							strMessage = strMessage.substr(1, 140) + ' ' + '...';
						}
					}
					
					{
						for (var strIdent in Player.playerHandle) {
							var playerHandle = Player.playerHandle[strIdent];
							
							if (playerHandle.strTeam === 'teamLogin') {
								continue;
							}
							
							{
								playerHandle.socketHandle.emit('chatHandle', {
									'strName': Player.playerHandle[socketHandle.strIdent].strName,
									'strMessage': strMessage
								});
							}
						}
					}
				}
			});
			
			socketHandle.on('playerHandle', function(jsonHandle) {
				{
					jsonHandle.dblPosition = jsonHandle.a;
					jsonHandle.dblVerlet = jsonHandle.b;
					jsonHandle.dblRotation = jsonHandle.c;
				}
				
				if (jsonHandle.dblPosition === undefined) {
					return;
					
				} else if (jsonHandle.dblPosition.length !== 3) {
					return;
					
				} else if (jsonHandle.dblVerlet === undefined) {
					return;
					
				} else if (jsonHandle.dblVerlet.length !== 3) {
					return;
					
				} else if (jsonHandle.dblRotation === undefined) {
					return;
					
				} else if (jsonHandle.dblRotation.length !== 3) {
					return;
					
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam === 'teamLogin') {
					return;
					
				}
				
				{
					Player.playerHandle[socketHandle.strIdent].dblPosition = jsonHandle.dblPosition;
					Player.playerHandle[socketHandle.strIdent].dblVerlet = jsonHandle.dblVerlet;
					Player.playerHandle[socketHandle.strIdent].dblRotation = jsonHandle.dblRotation;
				}
			});
			
			socketHandle.on('itemHandle', function(jsonHandle) {
				if (jsonHandle.strItem === undefined) {
					return;
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam === 'teamLogin') {
					return;

				} else if (jsonHandle.strItem.match(new RegExp('(itemPickaxe)|(itemSword)|(itemBow)', 'g')) === null) {
					return;
					
				}
				
				{
					Player.playerHandle[socketHandle.strIdent].strItem = jsonHandle.strItem;
				}
			});
			
			socketHandle.on('voxelHandle', function(jsonHandle) {
				if (jsonHandle.intCoordinate === undefined) {
					return;
					
				} else if (jsonHandle.intCoordinate.length !== 3) {
					return;
					
				} else if (jsonHandle.strType === undefined) {
					return;
					
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam === 'teamLogin') {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].intInteractionWeapon > 0) {
					return;
					
				} else if (World.updateBlocked(jsonHandle.intCoordinate) === true) {
					return;
					
				}
				
				{
					Player.playerHandle[socketHandle.strIdent].intInteractionWeapon = Constants.intInteractionPickaxeDuration;
				}
				
				{
					World.updateType(jsonHandle.intCoordinate, jsonHandle.strType);
				}
	
				{
					for (var strIdent in Player.playerHandle) {
						var playerHandle = Player.playerHandle[strIdent];
						
						if (playerHandle.strTeam === 'teamLogin') {
							continue;
						}
						
						{
							playerHandle.socketHandle.emit('voxelHandle', {
								'intCoordinate': jsonHandle.intCoordinate,
								'strType': jsonHandle.strType
							});
						}
					}
				}
			});
			
			socketHandle.on('weaponHandle', function(jsonHandle) {
				if (jsonHandle.strWeapon === undefined) {
					return;
				}
				
				if (Player.playerHandle[socketHandle.strIdent] === undefined) {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].strTeam === 'teamLogin') {
					return;
					
				} else if (Player.playerHandle[socketHandle.strIdent].intInteractionWeapon > 0) {
					return;
					
				}
				
				{
					if (jsonHandle.strWeapon === 'weaponSword') {
						Player.playerHandle[socketHandle.strIdent].intInteractionWeapon = Constants.intInteractionSwordDuration;
						
					} else if (jsonHandle.strWeapon === 'weaponBow') {
						Player.playerHandle[socketHandle.strIdent].intInteractionWeapon = Constants.intInteractionBowDuration;
						
					}
				}
				
				{
					if (jsonHandle.strWeapon === 'weaponSword') {
						var strIdent = 'itemSword' + ' - ' + Node.hashbase(Node.cryptoHandle.randomBytes(16)).substr(0, 8);
						var strPlayer = Player.playerHandle[socketHandle.strIdent].strIdent;
						var dblPosition = [ 0.0, 0.0, 0.0 ];
						var dblVerlet = [ 0.0, 0.0, 0.0 ];
						var dblAcceleration = [ 0.0, 0.0, 0.0 ];
						var dblRotation = [ 0.0, 0.0, 0.0 ];
						
						{
							dblPosition[0] = Player.playerHandle[socketHandle.strIdent].dblPosition[0];
							dblPosition[1] = Player.playerHandle[socketHandle.strIdent].dblPosition[1] + (0.25 * Constants.dblPlayerSize[1]);
							dblPosition[2] = Player.playerHandle[socketHandle.strIdent].dblPosition[2];
							
							dblVerlet[0] = dblPosition[0];
							dblVerlet[1] = dblPosition[1];
							dblVerlet[2] = dblPosition[2];
							
							dblAcceleration[0] = -1.0 * Math.sin(Player.playerHandle[socketHandle.strIdent].dblRotation[1]) * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[2]);
							dblAcceleration[1] = -1.0 * Math.sin(Player.playerHandle[socketHandle.strIdent].dblRotation[2] + (1.0 * Math.PI));
							dblAcceleration[2] = -1.0 * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[1]) * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[2]);
							
							dblRotation[0] = Player.playerHandle[socketHandle.strIdent].dblRotation[0];
							dblRotation[1] = Player.playerHandle[socketHandle.strIdent].dblRotation[1];
							dblRotation[2] = Player.playerHandle[socketHandle.strIdent].dblRotation[2];
						}
						
						var itemHandle = {
							'strIdent': strIdent,
							'strPlayer': strPlayer,
							'dblPosition': dblPosition,
							'dblVerlet': dblVerlet,
							'dblAcceleration': dblAcceleration,
							'dblRotation': dblRotation
						};
						
						{
							itemHandle.dblSize = [ 0.0, 0.0, 0.0 ];
							
							Physics.updateRaycol(itemHandle, function(functionRaycol) {
								var playerHandle = null;
								
								{
									if (functionRaycol.strIdent === undefined) {
										functionRaycol.strIdent = Object.keys(Player.playerHandle);
									}
								}
								
								{
									do {
										playerHandle = Player.playerHandle[functionRaycol.strIdent.pop()];
										
										if (playerHandle === undefined) {
											return null;
										}

										if (playerHandle.strTeam === 'teamLogin') {
											continue;
											
										} else if (playerHandle.strIdent === itemHandle.strPlayer) {
											continue;
											
										}
										
										var dblDistanceX = playerHandle.dblPosition[0] - itemHandle.dblPosition[0];
										var dblDistanceY = playerHandle.dblPosition[1] - itemHandle.dblPosition[1];
										var dblDistanceZ = playerHandle.dblPosition[2] - itemHandle.dblPosition[2];
										
										if (Math.sqrt((dblDistanceX * dblDistanceX) + (dblDistanceY * dblDistanceY) + (dblDistanceZ * dblDistanceZ)) > Constants.dblInteractionSwordRange) {
											continue;
										}
										
										break;
									} while (true);
								}
								
								{
									playerHandle.dblSize = Constants.dblPlayerHitbox;
								}
								
								return playerHandle;
							}, function(physicsHandle) {
								{
									Gameserver.playerHit(physicsHandle, itemHandle);
								}
							});
						}
						
					} else if (jsonHandle.strWeapon === 'weaponBow') {
						var strIdent = 'itemArrow' + ' - ' + Node.hashbase(Node.cryptoHandle.randomBytes(16)).substr(0, 8);
						var strPlayer = Player.playerHandle[socketHandle.strIdent].strIdent;
						var dblPosition = [ 0.0, 0.0, 0.0 ];
						var dblVerlet = [ 0.0, 0.0, 0.0 ];
						var dblAcceleration = [ 0.0, 0.0, 0.0 ];
						var dblRotation = [ 0.0, 0.0, 0.0 ];
						
						{
							dblPosition[0] = Player.playerHandle[socketHandle.strIdent].dblPosition[0] + (0.25 * Math.sin(Player.playerHandle[socketHandle.strIdent].dblRotation[1] + (0.5 * Math.PI)));
							dblPosition[1] = Player.playerHandle[socketHandle.strIdent].dblPosition[1] + (0.1);
							dblPosition[2] = Player.playerHandle[socketHandle.strIdent].dblPosition[2] + (0.25 * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[1] + (0.5 * Math.PI)));
							
							dblVerlet[0] = dblPosition[0];
							dblVerlet[1] = dblPosition[1];
							dblVerlet[2] = dblPosition[2];
							
							dblAcceleration[0] = -1.0 * Math.sin(Player.playerHandle[socketHandle.strIdent].dblRotation[1]) * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[2]);
							dblAcceleration[1] = -1.0 * Math.sin(Player.playerHandle[socketHandle.strIdent].dblRotation[2] + (1.0 * Math.PI));
							dblAcceleration[2] = -1.0 * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[1]) * Math.cos(Player.playerHandle[socketHandle.strIdent].dblRotation[2]);
							
							dblRotation[0] = Player.playerHandle[socketHandle.strIdent].dblRotation[0];
							dblRotation[1] = Player.playerHandle[socketHandle.strIdent].dblRotation[1];
							dblRotation[2] = Player.playerHandle[socketHandle.strIdent].dblRotation[2];
						}
						
						Item.itemHandle[strIdent] = {
							'strIdent': strIdent,
							'strPlayer': strPlayer,
							'dblPosition': dblPosition,
							'dblVerlet': dblVerlet,
							'dblAcceleration': dblAcceleration,
							'dblRotation': dblRotation
						};
						
					}
				}
			});
			
			socketHandle.on('disconnect', function() {
				{
					delete Player.playerHandle[socketHandle.strIdent];
				}
			});
		}
	});
}

var Constants = {
	intGameLoop: 16,
	
	intPlayerHealth: 100,
	dblPlayerMovement: [ 0.03, 0.18, 0.03 ],
	dblPlayerSize: [ 0.9, 1.6, 0.9 ],
	dblPlayerGravity: [ 0.0, -0.01, 0.0 ],
	dblPlayerMaxvel: [ 0.08, 0.26, 0.08 ],
	dblPlayerFriction: [ 0.8, 1.0, 0.8 ],
	dblPlayerHitbox: [ 0.4, 0.9, 0.4 ],
	
	intInteractionPickaxeDuration: 30,
	intInteractionSwordDuration: 30,
	intInteractionSwordDamage: 20,
	dblInteractionSwordImpact: [ 0.09, 0.09, 0.09 ],
	dblInteractionSwordRange: 2.0,
	intInteractionBowDuration: 30,
	intInteractionBowDamage: 20,
	dblInteractionBowImpact: [ 0.09, 0.09, 0.09 ],
	
	dblFlagSize: [ 1.0, 1.0, 1.0 ],
	dblFlagGravity: [ 0.0, -0.01, 0.0 ],
	dblFlagMaxvel: [ 0.08, 0.26, 0.08 ],
	dblFlagFriction: [ 0.8, 1.0, 0.8 ],
	dblFlagRotate: 0.02,
	
	dblArrowSize: [ 0.3, 0.3, 0.3],
	dblArrowGravity: [ 0.0, -0.001, 0.0 ],
	dblArrowMaxvel: [ 0.26 ],
	dblArrowFriction: [ 1.0, 1.0, 1.0 ]
};

var Gameserver = {
	strName: '',
	
	strLoginPassword: '',
	intLoginPassword: 0,
	strLoginMotd: '',
	
	strPhaseActive: '',
	intPhaseRound: 0,
	intPhaseRemaining: 0,
	
	strWorldAvailable: [],
	strWorldActive: '',
	strWorldFingerprint: '',
	
	intPlayerActive: 0,
	intPlayerCapacity: 0,
	
	intScoreRed: 0,
	intScoreBlue: 0,
	
	init: function() {
		{
			Gameserver.strName = VoxConf.strName;
		}
		
		{
			Gameserver.strLoginPassword = VoxConf.strLoginPassword;
			
			Gameserver.intLoginPassword = VoxConf.strLoginPassword === '' ? 0 : 1;
			
			Gameserver.strLoginMotd = VoxConf.strLoginMotd;
		}
		
		{
			Gameserver.strPhaseActive = 'Build';
			
			Gameserver.intPhaseRound = VoxConf.intPhaseRound;
			
			Gameserver.intPhaseRemaining = VoxConf.intPhaseRemaining;
		}
		
		{
			Gameserver.strWorldAvailable = VoxConf.strWorldAvailable;
			
			Gameserver.strWorldActive = Gameserver.strWorldAvailable[(Gameserver.strWorldAvailable.indexOf(Gameserver.strWorldActive) + 1) % Gameserver.strWorldAvailable.length];
			
			Gameserver.strWorldFingerprint = '';
		}
		
		{
			Gameserver.intPlayerCapacity = VoxConf.intPlayerCapacity;
			
			Gameserver.intPlayerActive = 0;
		}
		
		{
			Gameserver.intScoreRed = 0;
			
			Gameserver.intScoreBlue = 0;
		}
	},
	
	dispel: function() {
		{
			Gameserver.strName = '';
		}
		
		{
			Gameserver.strLoginPassword = '';
			
			Gameserver.intLoginPassword = 0;
			
			Gameserver.strLoginMotd = '';
		}
		
		{
			Gameserver.strPhaseActive = '';
			
			Gameserver.intPhaseRound = 0;
			
			Gameserver.intPhaseRemaining = 0;
		}
		
		{
			Gameserver.strWorldAvailable = [];
			
			Gameserver.strWorldActive = '';
			
			Gameserver.strWorldFingerprint = '';
		}
		
		{
			Gameserver.intPlayerCapacity = 0;
			
			Gameserver.intPlayerActive = 0;
		}
		
		{
			Gameserver.intScoreRed = 0;
			
			Gameserver.intScoreBlue = 0;
		}
	},
	
	phaseUpdate: function() {
		{
			Gameserver.intPhaseRemaining = Math.max(0, Gameserver.intPhaseRemaining - Constants.intGameLoop);
		}
		
		{
			if (Gameserver.intPhaseRemaining === 0) {
				{
					if (Gameserver.strPhaseActive === 'Build') {
						{
							Gameserver.strPhaseActive = 'Combat';
							
							Gameserver.intPhaseRound -= 0;
							
							Gameserver.intPhaseRemaining = VoxConf.intPhaseRemaining;
						}
						
					} else if (Gameserver.strPhaseActive === 'Combat') {
						{
							Gameserver.strPhaseActive = 'Build';
							
							Gameserver.intPhaseRound -= 1;
							
							Gameserver.intPhaseRemaining = VoxConf.intPhaseRemaining;
						}
						
					}
				}
				
				{
					if (Gameserver.intPhaseRound === 0) {
						{
							Gameserver.strPhaseActive = 'Build';
							
							Gameserver.intPhaseRound = VoxConf.intPhaseRound;
							
							Gameserver.intPhaseRemaining = VoxConf.intPhaseRemaining;
						}
						
						{
							Gameserver.strWorldActive = Gameserver.strWorldAvailable[(Gameserver.strWorldAvailable.indexOf(Gameserver.strWorldActive) + 1) % Gameserver.strWorldAvailable.length];
						}
					}
				}
			}
		}
	},
	
	worldUpdate: function() {
		{
			var boolUpdate = false;
			
			if (Gameserver.strWorldFingerprint.indexOf(Gameserver.strWorldActive) !== 0) {
				{
					boolUpdate = true;
				}
				
				{
					World.load(Node.fsHandle.readFileSync(__dirname + '/assets/worlds/' + Gameserver.strWorldActive + '.json').toString());
				}
				
			} else if (Gameserver.strWorldFingerprint.indexOf(Gameserver.strWorldActive + ' - ' + Gameserver.strPhaseActive) !== 0) {
				{
					boolUpdate = true;
				}
				
				{
					if (Gameserver.strPhaseActive === 'Build') {
					    for (var intFor1 = 0; intFor1 < World.intSeparator.length; intFor1 += 1) {
							var intCoordinate = World.intSeparator[intFor1];
							
							{
								World.updateType(intCoordinate, 'voxelSeparator');
							}
					    }
						
					} else if (Gameserver.strPhaseActive === 'Combat') {
					    for (var intFor1 = 0; intFor1 < World.intSeparator.length; intFor1 += 1) {
							var intCoordinate = World.intSeparator[intFor1];
							
							{
								World.updateType(intCoordinate, '');
							}
					    }
						
					}
				}
				
			}
			
			if (boolUpdate === true) {
				{
					Gameserver.strWorldFingerprint = Gameserver.strWorldActive + ' - ' + Gameserver.strPhaseActive + ' - ' + Gameserver.intPhaseRound;
				}
				
				{
					Item.initFlags();
				}
				
				{
					for (var strIdent in Player.playerHandle) {
						var playerHandle = Player.playerHandle[strIdent];
						
						if (playerHandle.strTeam === 'teamLogin') {
							continue;
						}
						
						{
							playerHandle.socketHandle.emit('worldHandle', {
								'strWorld': World.save()
							});
						}
						
						{
							Gameserver.playerRespawn(playerHandle);
						}
					}
				}
			}
		}
	},
	
	playerUpdate: function() {
		{
			Gameserver.intPlayerActive = 0;
		}
		
		{
			for (var strIdent in Player.playerHandle) {
				var playerHandle = Player.playerHandle[strIdent];
				
				if (playerHandle.strTeam === 'teamLogin') {
					continue;
				}
				
				{
					Gameserver.intPlayerActive += 1;
				}
			}
		}
	},
	
	playerRespawn: function(playerHandle) {
		{
			playerHandle.strItem = '';
		}
		
		{
			playerHandle.intHealth = Constants.intPlayerHealth;
		}
		
		{
			var intSpawn = [];
			
			if (playerHandle.strTeam === 'teamRed') {
				intSpawn = World.intSpawnRed[Math.floor(Math.random() * World.intSpawnRed.length)];
				
			} else if (playerHandle.strTeam === 'teamBlue') {
				intSpawn = World.intSpawnBlue[Math.floor(Math.random() * World.intSpawnBlue.length)];
				
			}

			playerHandle.dblPosition[0] = intSpawn[0] + 0.5;
			playerHandle.dblPosition[1] = intSpawn[1] + 2.0;
			playerHandle.dblPosition[2] = intSpawn[2] + 0.5;

			playerHandle.dblVerlet[0] = playerHandle.dblPosition[0];
			playerHandle.dblVerlet[1] = playerHandle.dblPosition[1];
			playerHandle.dblVerlet[2] = playerHandle.dblPosition[2];
		}
		
		{
			playerHandle.socketHandle.emit('playerRespawn', {
				'dblPosition': playerHandle.dblPosition,
				'dblVerlet': playerHandle.dblVerlet
			});
		}
	},
	
	playerHit: function(playerHandle, itemHandle) {
		{
			if (itemHandle.strIdent.indexOf('itemSword') === 0) {
				playerHandle.intHealth -= Constants.intInteractionSwordDamage;
				
			} else if (itemHandle.strIdent.indexOf('itemArrow') === 0) {
				playerHandle.intHealth -= Constants.intInteractionBowDamage;
				
			}
		}
		
		{
			if (playerHandle.intHealth >= 1) {
				{
					if (itemHandle.strIdent.indexOf('itemSword') === 0) {
						playerHandle.dblAcceleration[0] = -1.0 * Constants.dblInteractionSwordImpact[0] * Math.sin(itemHandle.dblRotation[1]) * Math.cos(itemHandle.dblRotation[2]);
						playerHandle.dblAcceleration[1] = -1.0 * Constants.dblInteractionSwordImpact[1] * Math.sin(itemHandle.dblRotation[2] + (1.0 * Math.PI));
						playerHandle.dblAcceleration[2] = -1.0 * Constants.dblInteractionSwordImpact[2] * Math.cos(itemHandle.dblRotation[1]) * Math.cos(itemHandle.dblRotation[2]);

					} else if (itemHandle.strIdent.indexOf('itemArrow') === 0) {
						playerHandle.dblAcceleration[0] = -1.0 * Constants.dblInteractionBowImpact[0] * Math.sin(itemHandle.dblRotation[1]) * Math.cos(itemHandle.dblRotation[2]);
						playerHandle.dblAcceleration[1] = -1.0 * Constants.dblInteractionBowImpact[1] * Math.sin(itemHandle.dblRotation[2] + (1.0 * Math.PI));
						playerHandle.dblAcceleration[2] = -1.0 * Constants.dblInteractionBowImpact[2] * Math.cos(itemHandle.dblRotation[1]) * Math.cos(itemHandle.dblRotation[2]);
						
					}
				}
				
				{
					playerHandle.socketHandle.emit('playerHit', {
						'dblAcceleration': playerHandle.dblAcceleration
					});
				}
				
			} else if (playerHandle.intHealth < 1) {
				{
					Player.playerHandle[itemHandle.strPlayer].intKills += 1;
				}
				
				{
					playerHandle.intDeaths += 1;
				}
				
				{
					Gameserver.playerRespawn(playerHandle);
				}
				
			}
		}
	},
	
	itemUpdate: function() {
		{
			for (var strIdent in Item.itemHandle) {
				var itemHandle = Item.itemHandle[strIdent];
				
				if (itemHandle.strIdent.indexOf('itemArrow') !== 0) {
					continue;
				}

				{
					itemHandle.dblSize = Constants.dblArrowSize;
					
					Physics.updateObjectcol(itemHandle, function(functionObjectcol) {
						var playerHandle = null;
						
						{
							if (functionObjectcol.strIdent === undefined) {
								functionObjectcol.strIdent = Object.keys(Player.playerHandle);
							}
						}
						
						{
							do {
								playerHandle = Player.playerHandle[functionObjectcol.strIdent.pop()];
								
								if (playerHandle === undefined) {
									return null;
								}
								
								if (playerHandle.strTeam === 'teamLogin') {
									continue;
									
								} else if (playerHandle.strIdent === itemHandle.strPlayer) {
									continue;
									
								}
								
								break;
							} while (true);
						}
						
						{
							playerHandle.dblSize = Constants.dblPlayerHitbox;
						}
						
						return playerHandle;
					}, function(physicsHandle) {
						{
							Gameserver.playerHit(physicsHandle, itemHandle);
						}
						
						{
							delete Item.itemHandle[itemHandle.strIdent];
						}
					});
				}
			}
		}
	}
};

var Physics = require(__dirname + '/libs/Physics.js')(Constants);
var World = require(__dirname + '/libs/World.js')(Constants, null);
var Player = require(__dirname + '/libs/Player.js')(Constants, null, Physics);
var Item = require(__dirname + '/libs/Item.js')(Constants, null, Physics);

{
	Gameserver.init();
}

{
	World.init();
}

{
	Player.init();
}

{
	Item.init();
	
	Item.functionFlag = function(strFlag) {
		if (strFlag === 'flagRed') {
			return World.intFlagRed[Math.floor(Math.random() * World.intFlagRed.length)];
			
		} else if (strFlag === 'flagBlue') {
			return World.intFlagBlue[Math.floor(Math.random() * World.intFlagBlue.length)];
			
		}
	};
}

{
	Physics.init();
	
	Physics.functionVoxelcol = function(intCoordinateX, intCoordinateY, intCoordinateZ) {
		if (intCoordinateY === 0) {
			return true;

		} else if (World.strType[[ intCoordinateX, intCoordinateY, intCoordinateZ ]] !== undefined) {
			return true;
			
		}
		
		return false;
	}
}

{
	var Animationframe_intTimestamp = new Date().getTime();
	
	var functionAnimationframe = function() {
		{
			Gameserver.phaseUpdate();
		}
		
		{
			Gameserver.worldUpdate();
		}
		
		{
			Player.update();
			
			Gameserver.playerUpdate();
		}
		
		{
			Item.update();
			
			Gameserver.itemUpdate();
		}
		
		{
			var jsonHandle = [];

			for (var strIdent in Player.playerHandle) {
				var playerHandle = Player.playerHandle[strIdent];
				
				{
					jsonHandle.push({
						'a': playerHandle.strIdent,
						'b': playerHandle.strTeam,
						'c': playerHandle.strItem,
						'd': playerHandle.strName,
						'e': playerHandle.intScore,
						'f': playerHandle.intKills,
						'g': playerHandle.intDeaths,
						'h': playerHandle.intHealth,
						'i': playerHandle.dblPosition,
						'j': playerHandle.dblVerlet,
						'k': playerHandle.dblRotation
					});
					
					// TODO: broadcast intInteractionWeapon, in order to animate others actions
				}
		    }
		    
			for (var strIdent in Player.playerHandle) {
				var playerHandle = Player.playerHandle[strIdent];
				
				if (playerHandle.strTeam === 'teamLogin') {
					continue;
				}
				
				{
					playerHandle.socketHandle.emit('playerHandle', jsonHandle);
				}
			}
		}
		
		{
			var jsonHandle = [];

			for (var strIdent in Item.itemHandle) {
				var itemHandle = Item.itemHandle[strIdent];
				
				{
					jsonHandle.push({
						'a': itemHandle.strIdent,
						'b': itemHandle.dblPosition,
						'c': itemHandle.dblVerlet,
						'd': itemHandle.dblRotation
					});
				}
		    }
		    
			for (var strIdent in Player.playerHandle) {
				var playerHandle = Player.playerHandle[strIdent];
				
				if (playerHandle.strTeam === 'teamLogin') {
					continue;
				}
				
				{
					playerHandle.socketHandle.emit('itemHandle', jsonHandle);
				}
			}
		}
		
		{
			var intWait = Constants.intGameLoop - (new Date().getTime() - Animationframe_intTimestamp);
			
			if (intWait >= 1) {
				setTimeout(functionAnimationframe, intWait);
				
			} else if (intWait < 1) {
				setImmediate(functionAnimationframe);
				
			}
		}
		
		{
			Animationframe_intTimestamp = new Date().getTime();
		}
	};
	
	setTimeout(functionAnimationframe, Constants.intGameLoop);
}

{
	// TODO: VoxConf.boolAdvertise
	
	var functionInterval = function() {
		var functionRequest = function() {
			var requestHttp = Node.httpHandle.request({
				'host': 'www.voxel-warriors.com',
				'port': 80,
				'path': '/host.xml?intPort=' + encodeURIComponent(Express.httpHandle.address().port) + '&strName=' + encodeURIComponent(Gameserver.strName) + '&intLoginPassword=' + encodeURIComponent(Gameserver.intLoginPassword) + '&strWorldActive=' + encodeURIComponent(Gameserver.strWorldActive) + '&intPlayerCapacity=' + encodeURIComponent(Gameserver.intPlayerCapacity) + '&intPlayerActive=' + encodeURIComponent(Gameserver.intPlayerActive),
				'method': 'GET'
			}, function(responseHttp) {
				var strContent = '';
				
				responseHttp.setEncoding('UTF-8');
				
				responseHttp.on('data', function(strData) {
					strContent += strData;
				});
				
				responseHttp.on('end', function() {
					functionSuccess();
				});
			});
			
			requestHttp.on('error', function(errorHandle) {
				functionError();
			});
			
			requestHttp.setTimeout(3 * 1000, function() {
				requestHttp.abort();
			});
			
			requestHttp.end();
		};
		
		var Errorsuccess_intTimestamp = new Date().getTime();
		
		var functionError = function() {
			var dateHandle = new Date();
			
			console.log('');
			console.log('------------------------------------------------------------');
			console.log('- Timestamp: ' + dateHandle.toISOString());
			console.log('- Origin: VoxRect');
			console.log('- Duration: ' + (dateHandle.getTime() - Errorsuccess_intTimestamp));
			console.log('- Status: Error');
			console.log('------------------------------------------------------------');
		};
		
		var functionSuccess = function() {
			var dateHandle = new Date();
			
			console.log('');
			console.log('------------------------------------------------------------');
			console.log('- Timestamp: ' + dateHandle.toISOString());
			console.log('- Origin: VoxRect');
			console.log('- Duration: ' + (dateHandle.getTime() - Errorsuccess_intTimestamp));
			console.log('- Status: Success');
			console.log('------------------------------------------------------------');
		};
		
		functionRequest();
	};
	
	setInterval(functionInterval, 5 * 60 * 1000);
	
	functionInterval();
}