Bias = function(bias){
    Object.defineProperties(this, {
        "rate": {
            value: 0.01,
            writable: false
        },
        "weight": {
            value: Math.random() * (2 - -2) + -2,
            writable: true
        },
        "bias": {
            value: 1,
            writable: false
        }
    });
}

Bias.prototype.train = function(force, error){
    this.weight += this.rate * error.x * force.x;
    this.weight += this.rate * error.y * force.y;
    this.weight = Math.min(Math.max(this.weight, 0), 1);
}
