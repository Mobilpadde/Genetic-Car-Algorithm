Connection = function(a, b){
    Object.defineProperties(this, {
        "rate": {
            value: 0.01,
            writable: false
        },
        "bias": {
            value: new Bias(1),
            writable: false
        },
        "weight": {
            value: Math.random() * (2 - -2) + -2,
            writable: true
        },
        "a": {
            value: a,
            writable: false
        },
        "b": {
            value: b,
            writable: false
        }
    });
}

Connection.prototype = {
    feedforward: function(){
        var _this = this;
        return {
            a: function(force){
                return _this.a.feedforward(_this.bias.bias * _this.bias.weight + force * _this.weight);
            },
            b: function(force){
                return _this.b.feedforward(_this.bias.bias * _this.bias.weight + force * _this.weight);
            }
        }
    },
    train: function(force, error){
        this.weight += this.rate * error.x * force.x;
        this.weight += this.rate * error.y * force.y;
        this.weight = Math.min(Math.max(this.weight, 0), 1);

        this.bias.train(force, error);
    }
}
