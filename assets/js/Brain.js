Brain = function(track){
    var _points = JSON.parse(JSON.stringify(track.points)),
        _weights = [];

    _points[Object.keys(_points).length] = JSON.parse(JSON.stringify(track.finish));

    for(var i in _points) _weights[i] = Math.random() * (1 - -1) + -1;

    Object.defineProperties(this, {
        "rate": {
            value: 0.01,
            writable: false
        },
        "weights": {
            value: _weights,
            writable: true
        }
    });
}

Brain.prototype = {
    process: function(forces){
        var sum = new Vector();

        for(var i in this.weights){
            forces[i].multiply(this.weights[i]);
            sum.add(forces[i]);
        }

        return sum;
    },
    train: function(forces, error){
        for(var i in this.weights){
            this.weights[i] += this.rate * error.x * forces[i].x;
            this.weights[i] += this.rate * error.y * forces[i].y;
            this.weights[i] = Math.min(Math.max(this.weights[i], 0), 1);
        }
    }
}
