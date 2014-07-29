Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

Date.prototype.addMinutes = function(mins)
{
    return new Date(this.valueOf() + (mins * 60 * 1000));
}