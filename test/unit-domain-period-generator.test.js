describe("Unit domain period generator", function () {

    var offsetHrs = new Date().getTimezoneOffset() / 60;
    var offsetISO = '0' + Math.abs(offsetHrs) + ':00';
    var iso = function(str) {
        return (str + '+' + offsetISO);
    };

    var PeriodGenerator;
    beforeEach(function () {
        PeriodGenerator = tauChart.__api__.UnitDomainPeriodGenerator;
    });

    it("should generate [day] range", function () {
        var r = [];
        var offset = new Date().getTimezoneOffset() / 60;
        var offsetISO = '0' + Math.abs(offset) + ':00';
        var iso = function(str) {
            return (str + '+' + offsetISO);
        };

        PeriodGenerator.generate(
            iso('2014-10-30T23:59:59'),
            iso('2014-11-02T10:00:00'),
            'day',
            function(x) {
                r.push(x)
            });

        expect(r.length).to.equal(4);

        expect(r[0].toJSON()).to.equal(new Date(iso('2014-10-30T00:00:00')).toJSON());
        expect(r[1].toJSON()).to.equal(new Date(iso('2014-10-31T00:00:00')).toJSON());
        expect(r[2].toJSON()).to.equal(new Date(iso('2014-11-01T00:00:00')).toJSON());
        expect(r[3].toJSON()).to.equal(new Date(iso('2014-11-02T00:00:00')).toJSON());
    });

    it("should generate [week] range (by sundays)", function () {
        var r = [];

        PeriodGenerator.generate(
            iso('2014-10-30T23:59:59'),
            iso('2014-11-02T10:00:00'),
            'week',
            function(x) {
                r.push(x)
            });

        expect(r.length).to.equal(2);

        expect(r[0].toJSON()).to.equal(new Date(iso('2014-10-26T00:00:00')).toJSON());
        expect(r[1].toJSON()).to.equal(new Date(iso('2014-11-02T00:00:00')).toJSON());
    });

    it("should generate [month] range", function () {
        var r = [];

        PeriodGenerator.generate(
            iso('2014-10-30T23:59:59'),
            iso('2014-11-02T10:00:00'),
            'month',
            function(x) {
                r.push(x)
            });

        expect(r.length).to.equal(2);

        expect(r[0].toJSON()).to.equal(new Date(iso('2014-10-01T00:00:00')).toJSON());
        expect(r[1].toJSON()).to.equal(new Date(iso('2014-11-01T00:00:00')).toJSON());
    });

    it("should generate [quarter] range", function () {
        var r = [];

        PeriodGenerator.generate(
            iso('2014-10-30T23:59:59'),
            iso('2015-04-02T10:00:00'),
            'quarter',
            function(x) {
                r.push(x)
            });

        expect(r.length).to.equal(3);

        expect(r[0].toJSON()).to.equal(new Date(iso('2014-10-01T00:00:00')).toJSON());
        expect(r[1].toJSON()).to.equal(new Date(iso('2015-01-01T00:00:00')).toJSON());
        expect(r[2].toJSON()).to.equal(new Date(iso('2015-04-01T00:00:00')).toJSON());
    });

    it("should generate [year] range", function () {
        var r = [];

        PeriodGenerator.generate(
            iso('1998-10-30T23:59:59'),
            iso('2002-11-02T10:00:00'),
            'year',
            function(x) {
                r.push(x)
            });

        expect(r.length).to.equal(5);

        expect(r[0].toJSON()).to.equal(new Date(iso('1998-01-01T00:00:00')).toJSON());
        expect(r[1].toJSON()).to.equal(new Date(iso('1999-01-01T00:00:00')).toJSON());
        expect(r[2].toJSON()).to.equal(new Date(iso('2000-01-01T00:00:00')).toJSON());
        expect(r[3].toJSON()).to.equal(new Date(iso('2001-01-01T00:00:00')).toJSON());
        expect(r[4].toJSON()).to.equal(new Date(iso('2002-01-01T00:00:00')).toJSON());
    });
});