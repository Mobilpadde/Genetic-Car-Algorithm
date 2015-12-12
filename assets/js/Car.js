Car = function(track){
    var _maxSpeed = 4,
        _maxForce = 0.05,

        _birth = new Date().getTime(),

        _velocity = new Vector(),
        _acceleration = new Vector(),

        _genes = [],
        _rounds = 0,

        _brain = new Brain(track),
        _brainCheck = new Date().getTime();

    /*for(var i = 0; i < 150; i++){
        var angle = Math.random() * Math.PI * 2;
        _genes.push(new Vector(Math.sin(angle), Math.cos(angle)).multiply(Math.random() * _maxForce));
    }*/

    Object.defineProperties(this, {
        "track": {
            value: track,
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
            if(Math.random() < rate) this.steer(i);
        }
    },
    onTrack: function(){
        if(!this.stopped){
            var points = JSON.parse(JSON.stringify(this.track.points)),
                shouldStop = [];

            points[Object.keys(points).length] = JSON.parse(JSON.stringify(this.track.finish));

            for(var i = 1; i < Object.keys(points).length; i++) shouldStop[i] = false;

            for(var i = 1; i < Object.keys(points).length; i++){
                var p0 = points[i - 1],
                    p1 = points[i];
                if(!(
                    this.location.x > p0.x - this.track.width / 2 + this.radius / 2 &&
                    this.location.x < p1.x + this.track.width / 2 - this.radius / 2 &&
                    this.location.y > p0.y - this.track.width / 2 + this.radius / 2 &&
                    this.location.y < p1.y + this.track.width / 2 - this.radius / 2
                )){
                    shouldStop[i] = true;
                }
            }

            var anyFalse = true; // Find a proper name
            for(var i in shouldStop){
                if(!shouldStop[i]){
                    anyFalse = false;
                    break;
                }
            }

            if(anyFalse){
                this.stopped = true;
                this.deadTime = new Date().getTime();
            }
        }

        return !this.stopped;
    },
    brainFart: function(){
        if(!this.stopped){
            if(new Date().getTime() - this.brainCheck > 2500){
                if(this.traveled - this.lastTraveled < 15){ // Arbitrary number
                    this.mutate(0.15);
                    this.stopped = true;
                }

                this.brainCheck = new Date().getTime();
                this.lastTraveled = this.traveled;
            }
        }
    },
    fitness: function(){ // Find a better way to calculate fitness
        var dist = Vector.distance(this.location, this.track.finish) || Infinity,
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
            points = JSON.parse(JSON.stringify(this.track.points));

        points[Object.keys(points).length] = JSON.parse(JSON.stringify(this.track.finish));

        for(var i in points){
            forces[i] = this.seek(points[i]);
        }

        output = this.brain.process(forces);
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

        var d = this.nextDesired();
        desired = points[d];
        //console.log(d);
        error = Vector.substract(desired, this.location);
        this.brain.train(forces, error);
    },
    seek: function(target){
        var desired = Vector.substract(target, this.location).normalize().multiply(this.maxSpeed),
            steer = Vector.substract(desired, this.velocity);

        return steer;
    },
    nextDesired: function(){
        var points = JSON.parse(JSON.stringify(this.track.points)),
            direction = new Vector();

        points[Object.keys(points).length] = JSON.parse(JSON.stringify(this.track.finish));

        for(var i = 1; i < Object.keys(points).length; i++){
            var p0 = points[i - 1],
                p1 = points[i];

            if(
                this.location.x > p0.x - this.track.width / 2 + this.radius / 2 &&
                this.location.x < p1.x + this.track.width / 2 - this.radius / 2 &&
                this.location.y > p0.y - this.track.width / 2 + this.radius / 2 &&
                this.location.y < p1.y + this.track.width / 2 - this.radius / 2
            ){
                return (i == Object.keys(points).length - 1 ? 0 : i + 1);
            }
        }
    },
    move: function(){
        if(!this.stopped){
            if(this.genes[this.currentGene]){
                //console.log("Genome");
                this.applyForce(this.genes[this.currentGene++]);
            }else{
                //console.log("Brain");
                this.steer(-1);
                this.currentGene++;
            }
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
        var points = JSON.parse(JSON.stringify(this.track.points)),
            direction = new Vector();

        points[Object.keys(points).length] = JSON.parse(JSON.stringify(this.track.finish));

        for(var i = 1; i < Object.keys(points).length; i++){
            var p0 = points[i - 1],
                p1 = points[i];

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
        ctx.save();
        ctx.fillStyle = "hsla(" + (this.traveled % 360) + ", 100%, 50%, 0.5)";
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
