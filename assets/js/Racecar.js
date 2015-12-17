Car = function(track){
    var _maxSpeed = 4,
        _maxForce = 0.05,

        _birth = new Date().getTime(),

        _velocity = new Vector(),
        _acceleration = new Vector(),

        _genes = [],
        _rounds = 0,

        _brain = new Brain(track),
        _brainCheck = new Date().getTime(),

        _lastDesired = null,
        _points = JSON.parse(JSON.stringify(track.points));

    _points[Object.keys(_points).length] = JSON.parse(JSON.stringify(track.finish));

    for(var i in _points){
        _points[i] = new Vector(_points[i].x, _points[i].y);
    }

    /*for(var i = 0; i < 150; i++){
        var angle = Math.random() * Math.PI * 2;
        _genes.push(new Vector(Math.sin(angle), Math.cos(angle)).multiply(Math.random() * _maxForce));
    }*/

    Object.defineProperties(this, {
        "track": {
            value: track,
            writable: false
        },
        "points": {
            value: _points,
            writable: false
        },

        "traveled": {
            value: 0,
            writable: true
        },
        "location": {
            value: track.finish.copy(),
            writable: false
        },
        "velocity": {
            value: _velocity,
            writable: false
        },
        "acceleration": {
            value: _acceleration,
            writable: false
        },

        "startTime": {
            value: _birth,
            writable: false
        },
        "deadTime": {
            value: -Infinity,
            writable: true
        },
        "finishTime": {
            value: Infinity,
            writable: true
        },

        "maxSpeed": {
            value: _maxSpeed,
            writable: false
        },
        "maxForce": {
            value: _maxForce,
            writable: false
        },

        "genes": {
            value: _genes,
            writable: true
        },
        "currentGene": {
            value: 0,
            writable: true
        },

        "stopped": {
            value: false,
            writable: true
        },
        "rounds": {
            get: function(){ return _rounds; },
            set: function(){ _rounds++; },
            configurable: false
        },

        "radius": {
            value: 5,
            writable: false
        },

        "brain": {
            value: _brain,
            writable: true
        },
        "brainCheck": {
            value: _brainCheck,
            writable: true
        },

        "lastDesired": {
            get: function(){ return _lastDesired; },
            set: function(ld){ _lastDesired = ld; },
            configurable: false
        },
        "lastTraveled": {
            value: -Infinity,
            writable: true
        }
    });
}

Car.prototype = {
    crossover: function(partner){
        var last, first, child, midpoint;

        if(this.genes.length >= partner.genes.length){
            first = partner;
            last = this;
        }else{
            first = this;
            last = partner;
        }

        child = new Car(this.track);
        child.brain = Object.create(this.brain);
        midpoint = Math.random() * first.genes.length;

        for(var i in last.genes){
            if(i < midpoint) child.genes[i] = first.genes[i].copy();
            else child.genes[i] = last.genes[i].copy();
        }

        return child;
    },
    mutate: function(rate){
        for(var i in this.genes){
            //if(Math.random() < rate) this.steer(i);
            if(Math.random < rate){
                var angle = Math.random() * Math.PI * 2;
                this.genes[i] = new Vector(Math.sin(angle), Math.cos(angle)).multiply(this.maxSpeed);
            }
        }
    },
    onTrack: function(){
        if(!this.stopped){
            var shouldStop = [];

            for(var i = 1; i < Object.keys(this.points).length; i++) shouldStop[i] = false;

            for(var i = 1; i < Object.keys(this.points).length; i++){
                var p0 = Vector.min(this.points[i - 1], this.points[i]),
                    p1 = Vector.max(this.points[i - 1], this.points[i]);

                if(!(
                    this.location.x > p0.x - this.track.width / 2 + this.radius / 2 &&
                    this.location.x < p1.x + this.track.width / 2 - this.radius / 2 &&
                    this.location.y > p0.y - this.track.width / 2 + this.radius / 2 &&
                    this.location.y < p1.y + this.track.width / 2 - this.radius / 2
                )){
                    shouldStop[i] = true;
                }
            }

            var noneFalse = true; // Find a proper name
            for(var i in shouldStop){
                if(!shouldStop[i]){
                    noneFalse = false;
                    break;
                }
            }

            if(noneFalse){
                this.stopped = true;
                //for(var i = this.currentGene; i > this.currentGene - 5; i--) this.steer(i);
                this.mutate(0.15);
                //this.brain.train(this.location, this.location.multiply(-1));
                this.deadTime = new Date().getTime();
            }
        }

        return !this.stopped;
    },
    brainFart: function(){
        if(!this.stopped){
            if(new Date().getTime() - this.brainCheck > 2000){
                if(this.traveled - this.lastTraveled < 15){ // Arbitrary number
                    // Figure a way to punish the brain...this.brain.train(you're stupid!); // Baaaad brain
                    this.mutate(0.15);
                    this.stopped = true;
                }

                this.brainCheck = new Date().getTime();
                this.lastTraveled = this.traveled;
            }
        }
    },
    fitness: function(){ // Find a better way to calculate fitness
        var dist = Vector.distance(this.location, this.nextDesired()) || Infinity,
            fitn = Math.pow(1 / dist, 2);

        if(this.finishTime == Infinity) fitn *= 0.1;
        if(this.stopped && this.finishTime == Infinity) fitn *= 0.1;
        else if(this.stopped && this.finishTime != Infinity) fitn *= 1.5;

        return fitn;
    },
    applyForce: function(force){
        this.acceleration.add(force); // Maybe some mass
    },
    steer: function(index){
        var forces = [],
            output = new Vector(),
            desired = new Vector(),
            error = new Vector(),
            next = this.nextDesired();

        //console.log(next);

        output = this.brain.feedforward(next).normalize();
        this.applyForce(output);

        if(index){
            while(index > this.genes.length) index--;
        }
        if(index && index > -1){
            if(this.genes[index] == output){
                var angle = Math.random() * Math.PI * 2;
                this.genes[index] = new Vector(Math.sin(angle), Math.cos(angle)).multiply(this.maxSpeed);
            }else this.genes[index] = output;
        }
        else this.genes.push(output);

        //if(next.x - this.location.x < 0 || next.y - this.location.y < 0) error = Vector.add(next, this.location).normalize();
        //else error = Vector.substract(next, this.location).normalize();
        //error = Vector.distance(next, this.location);
        error = Vector.substract(next, this.location).normalize();
        //console.log(error, output, next);
        //console.log(next);
        this.brain.train(output, error);
    },
    nextDesired: function(){
        for(var i = 1; i < Object.keys(this.points).length; i++){
            var p0 = Vector.min(this.points[i - 1], this.points[i]),
                p1 = Vector.max(this.points[i - 1], this.points[i]);

            if(
                this.location.x > p0.x - this.track.width / 2 + this.radius / 2 &&
                this.location.x < p1.x + this.track.width / 2 - this.radius / 2 &&
                this.location.y > p0.y - this.track.width / 2 + this.radius / 2 &&
                this.location.y < p1.y + this.track.width / 2 - this.radius / 2
            ){
                var index = (i == Object.keys(this.points).length - 1 ? 0 : i + 1)

                if(this.lastDesired > index && index == 0) this.rounds++;
                this.lastDesired = index;

                return this.points[index];
            }
        }

        return this.track.finish;
    },
    move: function(){
        if(!this.stopped){
            /*if(this.genes[this.currentGene]){
                //console.log("Genome");
                this.applyForce(this.genes[this.currentGene++]);
            }else{
                //console.log("Brain");
                this.steer(-1);
                this.currentGene++;
            }*/
            if(!this.genes[this.currentGene]){
                this.steer(-1);
                this.currentGene++;
            }else if(Math.random() >= 0.5) this.steer(this.currentGene); // Might as well mutate
            else this.applyForce(this.genes[this.currentGene++]);

            this.velocity.add(this.acceleration);
            this.velocity.limit(this.maxSpeed);

            this.travel();
            this.location.add(this.velocity);

            this.acceleration.multiply(0);

            this.location.x = Math.min(500, Math.max(0, this.location.x));
            this.location.y = Math.min(260, Math.max(0, this.location.y));
        }
    },
    travel: function(){
        for(var i = 1; i < Object.keys(this.points).length; i++){
            var p0 = Vector.min(this.points[i - 1], this.points[i]),
                p1 = Vector.max(this.points[i - 1], this.points[i]);

            if(
                this.location.x > p0.x - this.track.width / 2 + this.radius / 2 &&
                this.location.x < p1.x + this.track.width / 2 - this.radius / 2 &&
                this.location.y > p0.y - this.track.width / 2 + this.radius / 2 &&
                this.location.y < p1.y + this.track.width / 2 - this.radius / 2
            ){
                if(p0.x - p1.x < 0) this.traveled += this.velocity.x;
                else if(p0.x - p1.x > 0) this.traveled -= this.velocity.x;
                else if(p0.y - p1.y < 0) this.traveled += this.velocity.y;
                else if(p0.y - p1.y > 0) this.traveled -= this.velocity.y;
                break;
            }
        }
    },
    draw: function(ctx){
        ctx.fillStyle = "hsla(" + (this.traveled % 360) + ", 100%, 50%, 0.5)";
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}
