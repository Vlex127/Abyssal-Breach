// ================= MENU SCENE =================
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('ocean', 'assets/environment/background.png');
        this.load.image('mid', 'assets/environment/midground.png');
        this.load.image('hero', 'assets/player/fish_orange.png');

        this.load.audio('select', 'assets/sounds/blipSelect.wav');
        this.load.audio('oceanAmbience', 'assets/sounds/ocean.wav');
        this.load.audio('bubblesLoop', 'assets/sounds/watery_cave_loop.ogg');
        this.load.audio('deepHum', 'assets/sounds/watery_cave.mp3');
    }

    create() {
        this.bg = this.add.tileSprite(400,300,800,600,'ocean').setTileScale(2.5);
        this.mid = this.add.tileSprite(400,300,800,600,'mid').setAlpha(0.6);

        // Menu bubbles
        this.ambientBubbles = this.add.particles('hero').createEmitter({
            x:{min:0,max:800}, y:600, lifespan:5000,
            speedY:{min:-20,max:-50}, scale:{start:0.05,end:0},
            alpha:{start:0.2,end:0}, quantity:1, frequency:200
        });

        // Title
        this.titleText = this.add.text(400,150,"ABYSSAL BREACH",{fontSize:'72px',fontFamily:'Courier New',fontStyle:'bold'}).setOrigin(0.5);
        this.tweens.addCounter({
            from:0, to:1, duration:2000, yoyo:true, repeat:-1,
            onUpdate: tween => {
                let t = tween.getValue();
                let color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    new Phaser.Display.Color(0,242,255),
                    new Phaser.Display.Color(0,255,100),
                    1, t
                );
                this.titleText.setColor(`rgb(${color.r},${color.g},${color.b})`);
            }
        });

        // Floating fish
        this.fish = this.add.image(400,350,'hero').setScale(2.5).setAngle(90);
        this.tweens.add({ targets:this.fish, y:370, duration:1500, yoyo:true, repeat:-1 });

        // Start button
        let startBtn = this.add.text(400,500,"> INITIATE DESCENT <",{
            fontSize:'28px', fill:'#00ff00', backgroundColor:'#000',
            padding:{x:30,y:15}, fontFamily:'Courier New'
        }).setOrigin(0.5);

        let startHit = this.add.rectangle(400,500,startBtn.width + 80,startBtn.height + 40,0x000000,0).setOrigin(0.5);
        startHit.setInteractive({useHandCursor:true});
        startBtn.setDepth(2);

        const startGame = () => {
            if (this.sound && this.sound.get('select')) this.sound.play('select');
            this.scene.start('GameScene');
        };

        startHit.on('pointerover', ()=>startBtn.setStyle({fill:'#ffff00'}));
        startHit.on('pointerout', ()=>startBtn.setStyle({fill:'#00ff00'}));
        startHit.on('pointerdown', startGame);

        this.input.keyboard.once('keydown-ENTER', startGame);

        // Ambient audio
        if(!this.sound.get('oceanAmbience')) this.sound.add('oceanAmbience',{loop:true,volume:0.3}).play();
        if(!this.sound.get('bubblesLoop')) this.sound.add('bubblesLoop',{loop:true,volume:0.15}).play();
        if(!this.sound.get('deepHum')) this.sound.add('deepHum',{loop:true,volume:0.1}).play();
    }
}

// ================= GAME SCENE =================
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    preload() {
        this.load.on('loaderror', (file) => {
            console.error('[Asset load error]', file && file.key, file && file.src);
        });

        this.load.image('ocean','assets/environment/background.png');
        this.load.image('mid','assets/environment/midground.png');
        this.load.image('mine','assets/enemies/mine.png');
        this.load.image('rock','assets/enemies/mine-big.png');
        this.load.image('predator','assets/enemies/fish-big.png');
        this.load.image('cell','assets/player/fish_orange.png');
        this.load.image('hero','assets/player/fish_orange.png');

        this.load.audio('explosion','assets/sounds/explosion.wav');
        this.load.audio('sonar','assets/sounds/blipSelect.wav');
        this.load.audio('oceanAmbience','assets/sounds/ocean.wav');
        this.load.audio('bubblesLoop','assets/sounds/watery_cave_loop.ogg');
        this.load.audio('deepHum','assets/sounds/watery_cave.mp3');
    }

    create() {
        // Constants
        this.BASE_SCROLL=2; this.HYPER_SCROLL=18; this.BASE_SPEED=450; this.HYPER_SPEED=850;

        // Stats
        this.score=0; this.lives=5; this.isGameOver=false;
        this.isInvulnerable=false; this.isHyperspeed=false; this.hyperEnergy=100;
        this.highScore=localStorage.getItem('abyssalHighScore')||0;

        // Background
        this.bg=this.add.tileSprite(400,300,800,600,'ocean').setTileScale(2.5);
        this.mid=this.add.tileSprite(400,300,800,600,'mid').setAlpha(0.6);

        // HUD
        this.scoreText=this.add.text(16,35,'000000m',{fontSize:'42px',fill:'#00f2ff',fontFamily:'Courier New'});
        this.highScoreText=this.add.text(16,80,'MAX DEPTH:'+this.highScore+'m',{fontSize:'16px',fill:'#00f2ff',fontFamily:'Courier New'});
        this.hullBar=this.add.graphics(); this.energyBar=this.add.graphics();

        // Player
        this.player=this.physics.add.sprite(400,200,'hero').setScale(1.2).setAngle(90);
        this.player.setCollideWorldBounds(true); this.player.body.setSize(30,20).setOffset(25,30);

        // Shark
        this.shark=this.physics.add.sprite(400,-250,'hero').setScale(8).setTint(0x000000).setAlpha(0.7).setAngle(90);

        // Groups
        this.enemies=this.physics.add.group(); this.cells=this.physics.add.group();

        // Ambient bubbles
        this.ambientBubbles=this.add.particles('cell').createEmitter({
            x:{min:0,max:800}, y:600, lifespan:5000,
            speedY:{min:-20,max:-50}, scale:{start:0.05,end:0},
            alpha:{start:0.2,end:0}, quantity:1, frequency:200
        });

        // Fish bubble trail
        this.fishBubbles=this.add.particles('cell').createEmitter({
            follow:this.player, followOffset:{x:-10,y:0}, lifespan:600,
            speedX:{min:-30,max:-10}, speedY:{min:-20,max:20}, scale:{start:0.15,end:0},
            alpha:{start:0.7,end:0}, quantity:1, frequency:50, on:false
        });

        // Particle explosion for hits
        this.hitParticles=this.add.particles('cell').createEmitter({
            x:0, y:0, lifespan:500, speed:{min:-100,max:100},
            scale:{start:0.2,end:0}, alpha:{start:0.7,end:0}, quantity:10, on:false
        });

        // Enemy spawn timer
        this.enemySpawnDelay=1000;
        this.enemyTimer=this.time.addEvent({delay:this.enemySpawnDelay,callback:this.spawnEnemy,callbackScope:this,loop:true});
        this.time.addEvent({delay:3500,callback:this.spawnCell,callbackScope:this,loop:true});

        // Input
        this.cursors=this.input.keyboard.createCursorKeys();
        this.aKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceBar=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Collisions
        this.physics.add.overlap(this.player,this.enemies,this.hitEnemy,null,this);
        this.physics.add.overlap(this.player,this.cells,this.collectCell,null,this);
        this.physics.add.overlap(this.player,this.shark,()=>this.gameOver("CONSUMED BY THE ABYSS"),null,this);

        // Ambient audio
        if(!this.sound.get('oceanAmbience')) this.sound.add('oceanAmbience',{loop:true,volume:0.3}).play();
        if(!this.sound.get('bubblesLoop')) this.sound.add('bubblesLoop',{loop:true,volume:0.15}).play();
        if(!this.sound.get('deepHum')) this.sound.add('deepHum',{loop:true,volume:0.1}).play();
    }

    spawnEnemy() {
        if(this.isGameOver) return;
        let x=Phaser.Math.Between(50,750);
        let type=Phaser.Math.Between(0,100); let enemy;
        if(type<60) enemy=this.enemies.create(x,650,'mine');
        else if(type<85) enemy=this.enemies.create(x,650,'rock').setScale(1.0);
        else enemy=this.enemies.create(x,650,'predator');
        let stageBoost=Math.floor(this.score/1000)*60;
        enemy.body.setVelocityY(-(350+stageBoost));
        if(enemy.texture.key=='predator') enemy.body.setVelocityY(-(500+stageBoost));
        let newDelay=Phaser.Math.Clamp(1000-Math.floor(this.score/50),300,1000);
        this.enemyTimer.reset({delay:newDelay,callback:this.spawnEnemy,callbackScope:this,loop:true});
    }

    spawnCell() {
        if(this.isGameOver) return;
        let x=Phaser.Math.Between(100,700);
        let cell=this.cells.create(x,650,'cell').setScale(0.6).setTint(0x00ffff);
        cell.body.setVelocityY(-220);
    }

    collectCell(player,cell){
        cell.destroy(); this.hyperEnergy=Math.min(this.hyperEnergy+20,100);
        this.sound.play('sonar',{volume:0.15});
    }

    update() {
        if(this.isGameOver) return;

        // Hyperspeed
        if(this.spaceBar.isDown && this.hyperEnergy>0){
            this.isHyperspeed=true; this.hyperEnergy-=1.8;
            this.bg.tilePositionY+=this.HYPER_SCROLL; this.mid.tilePositionY+=this.HYPER_SCROLL*0.5;
            this.score+=15; this.cameras.main.setZoom(1.08);
            this.fishBubbles.on=true; this.fishBubbles.setSpeedX({min:-60,max:-20}); this.fishBubbles.setQuantity(2);
            this.bg.setScale(2.55); this.mid.setScale(2.55); this.bg.alpha=0.9;
        } else {
            this.isHyperspeed=false; this.hyperEnergy=Math.min(this.hyperEnergy+0.3,100);
            this.bg.tilePositionY+=this.BASE_SCROLL; this.mid.tilePositionY+=5; this.score+=2; this.cameras.main.setZoom(1);
            this.fishBubbles.on=false; this.fishBubbles.setSpeedX({min:-30,max:-10}); this.fishBubbles.setQuantity(1);
            this.bg.setScale(2.5); this.mid.setScale(2.5); this.bg.alpha=1;
        }

        // Movement
        let speed=this.isHyperspeed?this.HYPER_SPEED:this.BASE_SPEED;
        this.player.setVelocityX(0);
        if(this.cursors.left.isDown || this.aKey.isDown) this.player.setVelocityX(-speed);
        if(this.cursors.right.isDown || this.dKey.isDown) this.player.setVelocityX(speed);

        // Smooth fish lean
        let targetAngle=90+Phaser.Math.Clamp(this.player.body.velocity.x/10,-20,20);
        this.player.angle=Phaser.Math.Linear(this.player.angle,targetAngle,0.1);

        // Shark follow
        this.shark.y=Phaser.Math.Linear(this.shark.y,this.player.y-420,0.015);
        this.shark.x=Phaser.Math.Linear(this.shark.x,this.player.x,0.02);

        // HUD
        this.drawHUD();

        // Depth lighting
        let darkness=Phaser.Math.Clamp(255-this.score/20,30,255);
        this.bg.setTint(Phaser.Display.Color.GetColor(darkness,darkness,darkness));
        this.mid.setTint(Phaser.Display.Color.GetColor(darkness,darkness,darkness-30));
    }

    drawHUD() {
        this.scoreText.setText(this.score.toString().padStart(6,'0')+'m');
        this.hullBar.clear().fillStyle(0x330000).fillRect(600,32,180,10)
            .fillStyle(0xff0000).fillRect(600,32,(this.lives/5)*180,10);
        this.energyBar.clear().fillStyle(0x002222).fillRect(600,60,180,10)
            .fillStyle(0x00ffff).fillRect(600,60,(this.hyperEnergy/100)*180,10);
    }

    hitEnemy(player,enemy){
        if(this.isHyperspeed||this.isInvulnerable){enemy.destroy();return;}
        this.lives--; this.cameras.main.shake(300,0.03); enemy.destroy();
        this.hitParticles.setPosition(player.x,player.y); this.hitParticles.explode();
        this.sound.play('explosion',{volume:0.25});
        this.isInvulnerable=true; player.setTint(0xff0000);
        this.time.delayedCall(1200,()=>{this.isInvulnerable=false;if(!this.isGameOver)player.clearTint();});
        if(this.lives<=0) this.gameOver("HULL COLLAPSED");
    }

    gameOver(msg){
        this.isGameOver=true; this.physics.pause();
        if(this.score>this.highScore){this.highScore=this.score; localStorage.setItem('abyssalHighScore',this.highScore);}
        this.add.text(400,300,msg+"\nDEPTH: "+this.score+"m\nBEST: "+this.highScore+"m\nCLICK TO REBOOT",{fontSize:'32px',fill:'#fff',fontFamily:'Courier New',align:'center'}).setOrigin(0.5);
        this.input.once('pointerdown',()=>this.scene.restart());
    }
}

// ================= CONFIG =================
const config={type:Phaser.AUTO,width:800,height:600,physics:{default:'arcade',arcade:{debug:false}},scene:[MenuScene,GameScene]};
new Phaser.Game(config);