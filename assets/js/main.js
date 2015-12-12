$(document).ready(function(){
    $("#board")[0].width = 500;
    $("#board")[0].height = 260;

    var ctx = $("#board")[0].getContext("2d"),
        track = new Track(
            new Vector(250, 050), // start
            new Vector(350, 050), // 1
            new Vector(350, 100), // 2
            new Vector(270, 100), // 3
            new Vector(270, 170), // 4
            new Vector(150, 170), // 5
            new Vector(150, 050)  // 6
        ),
        cars = [],
        generation = 0,
        mutationRate = 0.05,
        reproducing = false,

        map = function(n, start1, stop1, start2, stop2){
            return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
        },
        selection = function(){
            var matingPool = [];

            var maxFit = 0,
                maxAlive = 0,
                maxRounds = 0;
            for(var i in cars){
                if(cars[i].fitness() > maxFit) maxFit = cars[i].fitness();
                if(cars[i].deadTime > maxAlive) maxAlive = cars[i].deadTime;
                if(cars[i].rounds > maxRounds) maxRounds = cars[i].rounds;
            }

            for(var i in cars){
                var fitnessNormal = map(cars[i].fitness(), 0, maxFit, 0, 1),
                    timeNormal = map(cars[i].deadTime, 0, maxAlive, 0, 1),
                    roundsNormal = map(cars[i].rounds, 0, maxRounds || 1, 0, 1),
                    n = fitnessNormal * 10 + timeNormal * 25 + roundsNormal * 50;

                for(var j = 0; j < n; j++){
                    matingPool.push(Object.create(cars[i]));
                }
            }

            return matingPool;
        },
        reproduce = function(){
            reproducing = true;

            var parents = selection();

            for(var i in cars){
                var mom = parents[~~(Math.random() * parents.length)],
                    dad = parents[~~(Math.random() * parents.length)],
                    child = mom.crossover(dad);

                child.mutate(mutationRate);

                cars[i] = child;
            }

            $("#generation").text(++generation);

            reproducing = false;
        }

    for(var i = 0; i < 10; i++){
        cars.push(new Car(track));
    }

    setInterval(function(){
        ctx.clearRect(0, 0, 500, 260);
        //ctx.fillStyle = "#000";
        //ctx.fillRect(0, 0, 500, 260);

        track.draw(ctx);

        if(!reproducing){
            var fitness = 0,
                carsDead = 0,
                deadTime = -Infinity;

            for(var i in cars){
                if(cars[i].onTrack()) cars[i].move();
                else carsDead++;
                cars[i].draw(ctx);
                fitness += cars[i].fitness();
                if(cars[i].deadTime > deadTime) deadTime = cars[i].deadTime;
            }

            $("#fitness").text((fitness / cars.length).toFixed(20));
            $("#aliveTime").text(new Date().getTime() - deadTime);
        }

        if(carsDead == cars.length) reproduce();

        $("#reproducing").text(reproducing);
    }, 1000 / 600);
});
