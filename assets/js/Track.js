Track = function(){
    Object.defineProperties(this, {
        "finish": {
            value: arguments[0],
            writable: false
        },
        "points": {
            value: arguments,
            writable: false // Should maybe be morphable
        },
        "width": {
            value: 45,
            writable: false
        }
    });
}

Track.prototype.draw = function(ctx){
    ctx.lineWidth = this.width;
    ctx.strokeStyle = "#333";

    ctx.beginPath();
    ctx.moveTo(this.finish.x, this.finish.y);
    for(var i in this.points){
        var p = this.points[i];
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
}
