var roleCarrier = {

    /** @param {Creep} creep **/
    run: function(creep,noLimits,distris) {
        
        // memory.travel means: going to source
        var index = Memory.energie.quelle.indexOf(creep.memory.job);
        var raum = Memory.energie.raum[index];
        let volume = creep.carryCapacity;
        var conti = Memory.energie.conti[index];
        var haufen = Memory.energie.haufen[index];
        var position = obj => new RoomPosition(obj.x, obj.y, obj.roomName);
        let speicher = creep.home.storage;
        let homedex = Memory.rooms[creep.memory.home];
        let spawn = Game.getObjectById(Memory.claim[homedex].spawns[0]);
        let targets = noLimits[homedex].energyNeed;
        
        
        
        if(Game.getObjectById(haufen)){
            var source = Game.getObjectById(haufen);
            var menge = source.amount;
        }
        else if(Memory.energie.conti[index]){var source = Game.getObjectById(conti);}
        
        
        
        
        //time to die
        if(creep.memory.death){
            creep.say('bye...',true);
            if(spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE){
                creep.travelTo(spawn);
            }
        }
        else if(creep.memory.job && creep.memory.travel) {
            // panic reaction
            if(raum === Memory.claim[homedex].AlarmRoom && raum!==creep.memory.home){
                creep.travelTo(creep.home.controller);
                creep.say('Yikes!!!',true);
                if(creep.room.name != Memory.claim[homedex].AlarmRoom && creep.carry.energy == 0){
                 creep.memory.travel = false;
                 Memory.energie.ordered[index] -= volume;
                }
            }
            else if(Memory.energie.waiting[index] < 21){
                creep.say('Dang!')
                creep.memory.travel = false;
                Memory.energie.ordered[index] -= volume;
            }
            else if(creep.room.name == raum){
                

                // try to get dropped energy
                if(haufen && menge>12){
                    if (creep.pos.isNearTo(source)&&creep.memory.travel){
                        if(creep.pickup(source) == 0){
                            if(!conti){
                                creep.memory.travel = false;
                                Memory.energie.ordered[index] -= volume;
                            }
                        }
                    }
                    else{
                        creep.travelTo(source);
                    }
                }
                // try to get container stuff
                if(conti){
                    if (creep.pos.isNearTo(source)&&creep.memory.travel){
                        if(creep.withdraw(source,RESOURCE_ENERGY) == 0){
                            creep.memory.travel = false;
                            Memory.energie.ordered[index] -= volume;
                        }
                    }
                    else{
                        creep.travelTo(source);
                    }
                }
                // if its full anyways...
                if(creep.carry.energy == volume && creep.memory.travel){
                    creep.memory.travel = false;
                    Memory.energie.ordered[index] -= volume;
                }
            }
            else{
                //creep.travelTo(creep.pos.findClosestByPath(creep.room.findExitTo(raum)));
                creep.travelTo(position(Memory.energie.position[index]));
            }
        }
        
        
        //haul back section:
        else if(creep.memory.job && !creep.memory.travel && creep.carry.energy> 0){
            if(Memory.claim[homedex].linkA){
                var linkA = Game.getObjectById(Memory.claim[homedex].linkA);
                var linkgy = linkA.energy<linkA.energyCapacity
            }
            if(linkgy && creep.carry.energy/creep.carryCapacity>1/2){
                if(creep.transfer(linkA, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(linkA);
                    creep.transfer(speicher,RESOURCE_ENERGY); //if possible, transfer to storage anyway
                }
            }
            else if(targets.length > 0&&!distris){
                if(creep.room.name===creep.memory.home){
                    var target = creep.pos.findClosestByRange(targets);
                }
                else{
                    var target = spawn;
                }
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(target);
                }
            }
            else if(speicher){
                if(creep.pos.isNearTo(speicher)){
                    creep.transfer(speicher,RESOURCE_ENERGY);
                }
                else{
                    creep.travelTo(speicher);
                    creep.transfer(speicher,RESOURCE_ENERGY);
                }
            }
            else{
                if(creep.pos.isEqualTo(spawn.pos.x, spawn.pos.y-3)){
                    creep.drop(RESOURCE_ENERGY);
                }
                else{
                    creep.travelTo(spawn.pos.x, spawn.pos.y-3)
                }
                
            } 
        }
        else if(creep.carry.energy == 0 && !creep.memory.travel && creep.memory.job){
            creep.memory.job = false;
        }
    // Get a job
        if(!creep.memory.job){
            let jobs = [];
            for(let n = 0; n < Memory.energie.waiting.length;n++){
                // does this energy belong to this creeps response rooms?
                if(Memory.energie.gov[n]!==creep.memory.home){
                    jobs[n] = 0;
                    continue;
                }
                if(Game.rooms[Memory.energie.raum[n]]){
                    Memory.energie.waiting[n] = 0;
                    if(Memory.energie.conti[n]){
                        Memory.energie.waiting[n] = Game.getObjectById(Memory.energie.conti[n]).store.energy;
                    }
                    if(Game.getObjectById(Memory.energie.haufen[n])){
                        var waiting = Game.getObjectById(Memory.energie.haufen[n])
                    }
                    else{
                        var waiting = Game.rooms[Memory.energie.raum[n]].lookForAt(LOOK_RESOURCES,Memory.energie.position[n].x,Memory.energie.position[n].y)[0];
                    }
                    if(waiting){
                        Memory.energie.waiting[n] += waiting.amount;
                        Memory.energie.haufen[n] = waiting.id;
                    }
                    else{
                        Memory.energie.haufen[n] = 0;
                    }
                } 
                jobs[n] = (Memory.energie.waiting[n] + Memory.energie.distance[n]*Memory.init.WORKs-Memory.energie.ordered[n]);
                // no job in infested room
                if(Memory.claim[Memory.rooms[Memory.energie.raum[n]]].hostile){jobs[n] = 0;}
                /* if it fits it sits
                if(jobs[n] > volume && Memory.energie.waiting[n] > 0){
                    // life is too short
                    if(creep.ticksToLive < 2.2*Memory.energie.distance[n]){
                        creep.memory.death=true;
                        break;
                    }
                    Memory.energie.ordered[n] += volume;
                    creep.memory.job = Memory.energie.quelle[n];
                    creep.memory.travel = true;
                    creep.say('going to '+n)
                    break;
                }*/
                // still no job?
            }
            let j = jobs.indexOf(Math.max(...jobs));
            if(creep.ticksToLive < 2.2*Memory.energie.distance[j]){
                creep.memory.death=true;
            }
            else{
                let j = jobs.indexOf(Math.max(...jobs));
                if (Memory.energie.waiting[j] > 0){
                    creep.say(jobs[j]+' @ '+j);
                    Memory.energie.ordered[j] += volume;
                    creep.memory.job = Memory.energie.quelle[j];
                    creep.memory.travel = true;
                }
            }
        }
	}
};

module.exports = roleCarrier;