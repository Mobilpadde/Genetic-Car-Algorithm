Neuron = function(){
    Object.defineProperties(this, {
        "rate": {
            value: 0.001,
            writable: false
        },
        "bias": {
            value: new Bias(1),
            writable: false
        },
        "weight": {
            value: Math.random() * (2 - -2) + -2,
            writable: true
        }
    });
}

Neuron.prototype = {
    feedforward: function(force){
        return this.bias.bias * this.bias.weight + force * this.weight;
    },
    train: function(force, error){
        this.weight += this.rate * error.x * force.x;
        this.weight += this.rate * error.y * force.y;
        this.weight = Math.min(Math.max(this.weight, 0), 1);

        //this.bias.train(force, error);
    }
}
