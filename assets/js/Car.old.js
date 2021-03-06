Car = function(track){
    var _maxSpeed = 4,
        _maxForce = 0.05,

        _birth = new Date().getTime(),

        _velocity = new Vector(),
        _acceleration = new Vector(),

        _genes = [],
        _rounds = 0,
        _lastDesired = null,
        _lastUpdateRounds = null,
        _points = JSON.parse(JSON.stringify(track.points));

    _points[Object.keys(_points).length] = JSON.parse(JSON.stringify(track.finish));

    for(var i in _points){
        _points[i] = new Vector(_points[i].x, _points[i].y);
    }

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
            value: _rounds,
            writable: true
        },
        "lastDesired": {
            value: _lastDesired,
            writable: true
        },
        "lastUpdateRounds": {
            value: _lastUpdateRounds,
            writable: true
        },

        "radius": {
            value: 5,
            writable: false
        }
    });
}

Car.prototype = {
    generateGeneAndApply: function(){
        var angle = Math.random() * (Math.PI * 2),
            gene = new Vector(Math.sin(angle), Math.cos(angle)).multiply(Math.random() * this.maxSpeed);
        //this.genes.push(gene);
        this.genes[this.currentGene++] = gene;
        this.applyForce(gene);
        //this.currentGene++;
    },
    badGene: function(){
        //console.log("Bad gene...");
        //this.currentGene--;
        //this.generateGeneAndApply();
        this.genes[this.currentGene - 1].negative().multiply(0.1);
    },
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
                this.genes[i] = new Vector(Math.sin(angle), Math.cos(angle)).multiply(Math.random() * this.maxSpeed);
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

            var noneFalse = true;
            for(var i in shouldStop){
                if(!shouldStop[i]){
                    noneFalse = false;
                    break;
                }
            }

            if(noneFalse){
                this.stopped = true;
                this.deadTime = new Date().getTime();
            }
        }

        return !this.stopped;
    },
    fitness: function(){ // Find abetter way to calculate fitness
        var dist = Vector.distance(this.location, this.nextDesired()) || Infinity,
            fitn = Math.pow(1 / dist, 2); //  + this.traveled

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

            this.travel();

            var next = this.nextDesired(),
                lastDistance = Vector.distance(next, this.location);

            this.location.add(this.velocity);

            if(Vector.distance(next, this.location) > lastDistance) this.badGene();
            //else console.log("Great gene, yay.");

            this.acceleration.multiply(0);

            this.location.x = Math.min(500, Math.max(0, this.location.x));
            this.location.y = Math.min(260, Math.max(0, this.location.y));
        }
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

                //if(this.lastDesired > index && index == 0) this.rounds++;
                if(
                    this.lastDesired != null && (
                    (
                        this.lastDesired < index &&
                        this.lastUpdateRounds != index &&
                        this.lastUpdateRounds != this.lastDesired
                    ) || (
                        this.lastDesired != null &&
                        this.lastDesired > index &&
                        index == 0
                    ))
                ){
                    this.rounds += 1 / Object.keys(this.points).length;
                    this.lastUpdateRounds = index;
                }

                this.lastDesired = index;

                return this.points[index];
            }
        }

        return this.track.finish;
    },
    travel: function(){
        var direction = new Vector();

        for(var i = 1; i < Object.keys(this.points).length; i++){
            var p0 = this.points[i - 1],
                p1 = this.points[i];

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
        ctx.fillStyle = "hsla(" + (Vector.distance(this.location, this.nextDesired()) % 360) + ", 100%, 50%, 0.5)";
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}
