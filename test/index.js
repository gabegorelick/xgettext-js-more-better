'use strict';

var should = require('should');
var xgettext = require('..');

describe('xgettext-js-more-better', function () {
  it('should work for the simple case', function () {
    var pos = xgettext('gettext("Hi")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hi');
    should(message.msgid_plural).not.be.ok;
    should(message.msgctxt).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it("shouldn't extract calls to non-gettext functions", function () {
    var pos = xgettext('someFunction("Hi")').toPOs();
    pos.length.should.equal(0);
  });

  it('should extract gettext as parameter', function () {
    var pos = xgettext('foo(gettext("Hi"))', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hi');
    should(message.msgid_plural).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it('should extract correct line number', function () {
    var pos = xgettext('\ngettext("Hi")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hi');
    message.references.should.eql(['foo.js:2']);
  });

  it('should extract domains', function () {
    var pos = xgettext('dgettext("domain", "Hi")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('domain');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hi');
    should(message.msgid_plural).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it('should extract plurals', function () {
    var pos = xgettext('ngettext("Boat", "Boats", 2)', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Boat');
    message.msgid_plural.should.equal('Boats');
    message.references.should.eql(['foo.js:1']);
  });

  it('should extract contexts', function () {
    var pos = xgettext('pgettext("Verb", "File")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('File');
    should(message.msgid_plural).not.be.ok;
    message.msgctxt.should.equal('Verb');
    message.references.should.eql(['foo.js:1']);
  });

  it('should extract dcnpgettext calls', function () {
    var pos = xgettext('dcnpgettext("domain", "context", "id", "plural", "n", "category")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('domain');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('id');
    message.msgctxt.should.equal('context');
    message.msgid_plural.should.equal('plural');
    message.references.should.eql(['foo.js:1']);
  });

  it('should support extracting method calls', function () {
    var pos = xgettext('i18n.gettext("Hi")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hi');
    should(message.msgid_plural).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it("shouldn't emit PO for file that has no messages", function () {
    var pos = xgettext('', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(0);
  });

  it("shouldn't extract calls to gettext with non-string literals", function () {
    var pos = xgettext('gettext(someVariable)').toPOs();
    pos.length.should.equal(0);
  });

  it("shouldn't extract calls to gettext with no arguments", function () {
    var pos = xgettext('gettext()').toPOs();
    pos.length.should.equal(0);
  });

  it('should extract concatenated strings', function () {
    var pos = xgettext('gettext("Hello " + "World")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hello World');
    should(message.msgid_plural).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it('should extract twice concatenated strings', function () {
    var pos = xgettext('gettext("Hello " + "World" + "!")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hello World!');
    should(message.msgid_plural).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it('should extract multi-line strings', function () {
    var pos = xgettext('gettext("Hello " +\n "World")', {filename: 'foo.js'}).toPOs();
    pos.length.should.equal(1);
    pos[0].domain.should.equal('messages');
    pos[0].items.length.should.equal(1);

    var message = pos[0].items[0];
    message.msgid.should.equal('Hello World');
    should(message.msgid_plural).not.be.ok;
    message.references.should.eql(['foo.js:1']);
  });

  it("shouldn't extract concatenated strings with non-literal parts", function () {
    var pos = xgettext('gettext("Hello " + variable)').toPOs();
    pos.length.should.equal(0);
  });
});
