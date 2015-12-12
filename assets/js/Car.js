Car = function(track){
    var _maxSpeed = 4,
        _maxForce = 0.05,

        _birth = new Date().getTime(),

        _velocity = new Vector(),
        _acceleration = new Vector(),

        _genes = [],
        _rounds = 0;

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
        }
    });
}

Car.prototype = {
    generateGeneAndApply: function(){
        var angle = Math.random() * (Math.PI * 2),
            gene = new Vector(Math.sin(angle), Math.cos(angle)).multiply(Math.random() * this.maxForce);
        this.genes.push(gene);
        this.applyForce(gene);
        this.currentGene++;
    },
    crossover: function(partner){
        var last, first, child, midppoint;

        if(this.genes.length >= partner.genes.length){
            first = partner;
            last = this;
        }else{
            first = this;
            last = partner;
        }

        child = new Car(this.track);
        midpoint = Math.random() * first.genes.length;

        for(var i in last.genes){
            if(i < midpoint) child.genes[i] = first.genes[i];
            else child.genes[i] = last.genes[i];
        }

        return child;
    },
    mutate: function(rate){
        for(var i in this.genes){
            if(Math.random() < rate){
                var angle = Math.random() * (Math.PI * 2);
                this.genes[i] = new Vector(Math.sin(angle), Math.cos(angle)).multiply(Math.random() * this.maxForce);
            }
        }
    },
    onTrack: function(){
        if(!this.stopped){
            var points = JSON.parse(JSON.stringify(this.track.points)),
                shouldStop = [];

            points[Object.keys(points).length] = JSON.parse(JSON.stringify(this.track.finish))

            for(var i = 1; i < Object.keys(points).length; i++) shouldStop[i] = false;

            for(var i = 1; i < Object.keys(points).length; i++){
                var p0 = points[i - 1],
                    p1 = points[i];
                if(!(
                    this.location.x > p0.x - this.track.width / 2 + 2.5 &&
                    this.location.x < p1.x + this.track.width / 2 - 2.5 &&
                    this.location.y > p0.y - this.track.width / 2 + 2.5 &&
                    this.location.y < p1.y + this.track.width / 2 - 2.5
                )){
                    shouldStop[i] = true;
                }
            }

            var anyFalse = true;
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
    fitness: function(){
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
    move: function(){
        if(!this.stopped){
            if(this.genes[this.currentGene]){
                this.applyForce(this.genes[this.currentGene++]);
            }else{
                this.generateGeneAndApply();
            }
            this.velocity.add(this.acceleration);
            this.velocity.limit(this.maxSpeed);

            this.traveled += Math.abs(this.velocity.x) + Math.abs(this.velocity.y);
            this.location.add(this.velocity);

            this.acceleration.multiply(0);

            this.location.x = Math.min(500, Math.max(0, this.location.x));
            this.location.y = Math.min(260, Math.max(0, this.location.y));
        }
    },
    draw: function(ctx){
        ctx.save();
        ctx.fillStyle = "hsla(" + (this.fitness() * 100) + ", 100%, 50%, 0.5)";
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
