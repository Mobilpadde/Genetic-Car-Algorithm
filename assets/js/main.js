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
        mutationRate = 0.1,
        reproducing = false,

        map = function(n, start1, stop1, start2, stop2){
            return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
        },
        selection = function(){
            var matingPool = [];

            var maxFit = 0,
                maxAge = 0,
                maxRounds = 0,
                maxTraveled = 0;
            for(var i in cars){
                if(cars[i].fitness() > maxFit) maxFit = cars[i].fitness();
                if(cars[i].currentGene > maxAge) maxAge = cars[i].currentGene;
                if(cars[i].rounds > maxRounds) maxRounds = cars[i].rounds;
                if(cars[i].traveled > maxTraveled) maxTraveled = cars[i].traveled;
            }

            for(var i in cars){
                var fitnessNormal = map(cars[i].fitness(), 0, maxFit || 1, 0, 1),
                    ageNormal = map(cars[i].currentGene, 0, maxAge || 1, 0, 1),
                    traveledNormal = map(cars[i].rounds, 0, maxTraveled || 1, 0, 1),
                    roundsNormal = map(cars[i].rounds, 0, maxRounds || 1, 0, 1),

                    n = fitnessNormal * 1 + ageNormal * 2 + traveledNormal * 4 + roundsNormal * 8;

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
                    dad = mom,//parents[~~(Math.random() * parents.length)],
                    child = mom.crossover(dad);

                child.mutate(mutationRate);

                cars[i] = child;
            }

            $("#generation").text(++generation);

            reproducing = false;
        }

    for(var i = 0; i < 50; i++){
        cars.push(new Car(track));
    }

    var maxAge = 0,
        maxTraveled = 0,
        maxRounds = 0;
    setInterval(function(){
        ctx.clearRect(0, 0, 500, 260);
        //ctx.fillStyle = "#000";
        //ctx.fillRect(0, 0, 500, 260);

        track.draw(ctx);

        if(!reproducing){
            var fitness = 0,
                carsDead = 0,
                age = 0,
                traveled = 0,
                rounds = 0;

            for(var i in cars){
                if(cars[i].brainFart) cars[i].brainFart();
                if(cars[i].onTrack()) cars[i].move();
                else carsDead++;
                cars[i].draw(ctx);
                fitness += cars[i].fitness();
                if(cars[i].currentGene > age) age = cars[i].currentGene;
                if(cars[i].traveled > traveled) traveled = cars[i].traveled;
                if(cars[i].rounds > rounds) rounds = cars[i].rounds;
            }

            $("#fitness").text((fitness / cars.length).toFixed(20));

            if(age > maxAge) maxAge = age;
            $("#aliveTime").text(age + " (" + maxAge + ")");

            if(traveled > maxTraveled) maxTraveled = traveled;
            $("#traveled").text(traveled.toFixed(1) + " (" + maxTraveled.toFixed(1) + ")");

            if(rounds > maxRounds) maxRounds = rounds;
            $("#rounds").text((rounds * 100) + "% (" + (maxRounds * 100) + "%)");
        }

        if(carsDead == cars.length) reproduce();

        $("#reproducing").text(reproducing);
    }, 1000 / (cars[0].brainFart ? 30 : 60)); // Chance to something like 600 if using Car.old.js // / (cars[0].brainFart ? 30 : 600)
});
