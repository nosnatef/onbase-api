import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const conn = require('api/v1/db/oracledb/connection');
const onBaseSerializer = require('api/v1/serializers/onbase-serializer');
const testData = require('./test-data');

chai.should();
chai.use(chaiAsPromised);

let onBaseDao;

describe('Test onbase-dao', () => {
  /*
  * The execute function gets called for a variety of reasons in the class being tested
  * Each test will need fine tuned control over what is returned from execute
  */
  const connectionStub = (execStub) => {
    sinon.stub(conn, 'getConnection').resolves({
      execute: execStub,
      close: () => null,
    });
  };

  const testSingleResult = (result) => result.should
    .eventually.be.fulfilled
    .and.deep.equals([{}])
    .and.to.have.length(1);

  const testMultipleResults = (result) => result.should
    .eventually.be.fulfilled
    .and.deep.equals([{}, {}])
    .and.to.have.length(2);

  /*
    * error message will be the same as the line length
    * because we are generating an array of numbers
    */
  const testLineErrorResult = (result) => result.should
    .eventually.be.rejectedWith(testData.errorLineLength)
    .and.be.an.instanceOf(Error);


  beforeEach(() => {
    const serializeOnBaseStub = sinon.stub(onBaseSerializer, 'serializeOnBase');
    serializeOnBaseStub.returnsArg(0);

    onBaseDao = proxyquire('api/v1/db/oracledb/onbase-dao', {
      '../../serializers/onbase-serializer': {
        serializeOnBase: serializeOnBaseStub,
      },
    });
  });
  afterEach(() => sinon.restore());

  describe('Test getOnBase', () => {
    it('getOnBase should be fulfilled with a single result', () => {
      const execStub = sinon.stub();
      execStub.returns(testData.outBindsLast);
      connectionStub(execStub);

      const result = onBaseDao.getOnBase();
      return testSingleResult(result);
    });

    it('getOnBase should be fulfilled with multiple results', () => {
      const execStub = sinon.stub();
      // third call is a special case that we want to cause getLine to recurse
      execStub.onThirdCall().returns(testData.outBindsRecursive);
      execStub.returns(testData.outBindsLast);
      connectionStub(execStub);

      const result = onBaseDao.getOnBase();
      return testMultipleResults(result);
    });

    it(`getOnBase should throw error when line length is >= ${testData.errorLineLength - 1}`, () => {
      const execStub = sinon.stub();
      execStub.returns(testData.outBindsError);
      connectionStub(execStub);

      const result = onBaseDao.getOnBase();
      return testLineErrorResult(result);
    });
  });

  describe('Test patchOnBase', () => {
    it('patchOnBase should be fulfilled with a single result', () => {
      const execStub = sinon.stub();
      execStub.returns(testData.outBindsLast);
      connectionStub(execStub);

      const result = onBaseDao.patchOnBase(testData.fakeId, testData.patchBody);
      return testSingleResult(result);
    });

    it('patchOnBase should be fulfilled with multiple results', () => {
      const execStub = sinon.stub();
      // third call is a special case that we want to cause getLine to recurse
      execStub.onThirdCall().returns(testData.outBindsRecursive);
      execStub.returns(testData.outBindsLast);
      connectionStub(execStub);

      const result = onBaseDao.patchOnBase(testData.fakeId, testData.patchBody);
      return testMultipleResults(result);
    });

    it(`patchOnBase should throw error when line length is >= ${testData.errorLineLength - 1}`, () => {
      const execStub = sinon.stub();
      execStub.returns(testData.outBindsError);
      connectionStub(execStub);

      const result = onBaseDao.patchOnBase(testData.fakeId, testData.patchBody);
      return testLineErrorResult(result);
    });

    it('patchOnBase should throw error with improper body', () => {
      const result = onBaseDao.patchOnBase(testData.fakeId, testData.invalidPatchBody);
      return result.should
        .eventually.be.rejected
        .and.be.an.instanceOf(Error);
    });
  });
});
