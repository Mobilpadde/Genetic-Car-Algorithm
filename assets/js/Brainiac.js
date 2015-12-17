Brain = function(track){
    var _points = JSON.parse(JSON.stringify(track.points)),
        _connectionsLeft = [],
        _connectionsRight = [],
        _neurons = [],
        _inputLeft = new Neuron(),
        _inputRight = new Neuron(),
        _output = new Neuron();

    _neurons.push(_inputLeft);
    _neurons.push(_inputRight);

    //_points[Object.keys(_points).length] = JSON.parse(JSON.stringify(track.finish));
    for(var i = 0; i < Object.keys(_points).length; i++){
        var n = new Neuron();
        _connectionsLeft[i] = new Connection(_inputLeft, n);
        _connectionsRight[i] = new Connection(_inputRight, n);
        _neurons[i + 2] = n;
    }

    for(var i in _neurons){
        if(i > 1){
            _connectionsLeft[i] = new Connection(_neurons[i], _output);
            _connectionsRight[i] = new Connection(_neurons[i], _output);
        }
    }

    _neurons[_neurons.length] = _output;

    Object.defineProperties(this, {
        "connections": {
            value: {
                left: _connectionsLeft,
                right: _connectionsRight
            },
            writable: false
        },
        "neurons": {
            value: _neurons,
            writable: false
        }
    });
}

Brain.prototype = {
    feedforward: function(force){
        var sum = new Vector();

        for(var i in this.connections.left){
            var thoughtFromLeftA = this.connections.left[i].feedforward().a(force.x),
                thoughtFromRightA = this.connections.right[i].feedforward().a(force.y),

                thoughtFromLeftB = this.connections.left[i].feedforward().a(thoughtFromLeftA),
                thoughtFromRightB = this.connections.right[i].feedforward().a(thoughtFromRightA)

                //console.log(thoughtFromLeftA, thoughtFromRightA, thoughtFromLeftB, thoughtFromRightB);

            sum.add(new Vector(thoughtFromLeftB, thoughtFromRightB));
            //thoughtFromA = this.connections[i].feedforward().a(force);
            //sum.add(this.connections[i].feedforward().b(thoughtFromA));
        }
        console.log(sum);
        return sum;
    },
    train: function(force, error){
        for(var i in this.connections.left){
            this.connections.left[i].train(force, error);
            this.connections.right[i].train(force, error);
            //console.log(this.connections[i].weight);
        }

        for(var i in this.neurons){
            this.neurons[i].train(force, error);
            //console.log(this.neurons[i].weight);
        }

        //console.log(force, error);
    }
}
