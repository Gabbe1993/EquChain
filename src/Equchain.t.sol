pragma solidity ^0.4.19;

import "ds-test/test.sol";

import "./Equchain.sol";

contract EquchainTest is DSTest {
    Equchain equchain;

    function setUp() public {
        equchain = new Equchain();
    }

    function testFail_basic_sanity() public {
        assertTrue(false);
    }

    function test_basic_sanity() public {
        assertTrue(true);
    }
}
