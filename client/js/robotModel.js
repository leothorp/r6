function Robot(id,pos,mesh,skeleton) {
  this.id = id;
  this.accelerationForward = 1; //in seconds
  this.brakeSpeed = 0.8; //Acceleration removed per second
  this.speedDecay = 0.5; //percent of speed that dies per second 
  this.turnSpeed = 1; // rotation per second (~6.28 is a 360 degrees per second)
  this.maxSpeed = 10; //clamps the magnidue of speed vector
  this.velocity = 0;
  this.distance = -1;
  this._buildRobot(mesh, skeleton);
  this.pivot.position = pos;

  this.setState('running'); //initial state
  //make mesh, set position
  this.isRunning = false; 
  this.isBoosting = false;
}
//creates the mesh and necissary pivot points
Robot.prototype._buildRobot = function(mesh, skeleton) {
  this.mesh = mesh.clone(this.id + '_mesh'); 
  this.skeleton = skeleton.clone(this.id + '_skeleton'); 
  this.mesh.skeleton = this.skeleton; 
  this.mesh.rotation = new BABYLON.Vector3(0, Math.PI * 0.5, 0);
  //The mesh is a child of the pivot, we never modify the mesh directly.
  this.pivot =  new BABYLON.Mesh.CreateBox(this.ide + '_pivot',1,scene);
  this.pivot.isVisible = false; 
  this.mesh.parent = this.pivot; 
  this.mesh.position = BABYLON.Vector3.Zero(); 
  //The camera doesn't support parent / child, so we set it's position to be the camPivot's pos
  this.camPivot =  new BABYLON.Mesh.CreateBox(this.id + '_pivot',1,scene);
  this.camPivot.isVisible = false; 
  this.camPivot.parent = this.pivot; 
  this.camPivot.position = new BABYLON.Vector3(10,3, 0); 
  //create an emitter for the boosting fx
  this.boostPivotR = new BABYLON.Mesh.CreateBox(this.id + '_boostPivotR',1,scene);
  this.boostPivotR.attachToBone(this.skeleton.bones[28], this.mesh); 
  this.boostPivotR.isVisible = false; 
  this.boostPivotL = new BABYLON.Mesh.CreateBox(this.id + '_boostPivotL',1,scene);
  this.boostPivotL.attachToBone(this.skeleton.bones[29], this.mesh); 
  this.boostPivotL.isVisible = false; 
  this.stopRunning();
};

Robot.prototype.update = function(input){
  //if we are attacking
  if(input.robotModel.attackBox.length) {
    for(var i = 0; i < input.robotModel.attackBox.length; i++) {
      vfx.attack(new BABYLON.Vector3(input.robotModel.attackBox[i].x, 0, input.robotModel.attackBox[i].z));
    }
  } 
  if(input.robotModel.state.name !== this.state.name) {
    this.setState(input.robotModel.state.name);
  }
  if (input.socketId === socket.id && this.distance !== input.robotModel.distance) {
    reportLap(input.robotModel.distance,scene);
  }  
  this.distance = input.robotModel.distance;
  this.state.update(this,input); 
};

Robot.prototype.setState = function(name){
  var state = Robot.states[name];
  if(this.state && this.state.exitState){
    this.state.exitState(this); 
  }
  this.state = state; 
  if(this.state.enterState){
    this.state.enterState(this);
  } 
};

Robot.prototype.startRunning = function(){
  sounds.step.loop = true;
  sounds.step.setVolume(0.7);
  if (this.id===socket.id) sounds.step.play();
  sounds.step.stop(2);
  scene.beginAnimation(this.skeleton,25,48,true,1.0); 
  this.isRunning = true; 
};

Robot.prototype.stopRunning = function(){
  scene.beginAnimation(this.skeleton,1,20,true,1.0); 
  sounds.step.stop();
  this.isRunning = false;
};

Robot.prototype.startBoosting = function(){
  scene.beginAnimation(this.skeleton,55,80,true,1.0); 
};

Robot.prototype.stopBoosting = function(){
  //stop playing sfx
};

Robot.states = {
  running: new Running(),
  death: new Death(), 
  boosting: new Boosting(),
  waiting: new Waiting()
};
