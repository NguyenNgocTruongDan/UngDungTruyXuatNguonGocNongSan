// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Traceability {
    enum ActionType {
        SEEDING,
        FERTILIZING,
        WATERING,
        PEST_CONTROL,
        HARVESTING,
        PACKAGING,
        SHIPPING
    }

    struct Action {
        bytes32 dataHash;
        ActionType actionType;
        uint64 timestamp;
        address recorder;
    }

    struct Batch {
        address owner;
        bool exists;
        Action[] actions;
    }

    mapping(string => Batch) private batches;

    event BatchCreated(
        string indexed batchId,
        address indexed owner,
        uint256 timestamp
    );

    event ActionAdded(
        string indexed batchId,
        bytes32 dataHash,
        ActionType actionType,
        address indexed recorder,
        uint256 timestamp
    );

    modifier onlyBatchOwner(string calldata batchId) {
        require(batches[batchId].exists, 'Batch does not exist');
        require(
            batches[batchId].owner == msg.sender,
            'Only batch owner can perform this action'
        );
        _;
    }

    function createBatch(string calldata batchId) external {
        require(!batches[batchId].exists, 'Batch already exists');

        Batch storage b = batches[batchId];
        b.owner = msg.sender;
        b.exists = true;

        emit BatchCreated(batchId, msg.sender, block.timestamp);
    }

    function addAction(
        string calldata batchId,
        bytes32 dataHash,
        ActionType actionType
    ) external onlyBatchOwner(batchId) {
        batches[batchId].actions.push(
            Action({
                dataHash: dataHash,
                actionType: actionType,
                timestamp: uint64(block.timestamp),
                recorder: msg.sender
            })
        );

        emit ActionAdded(
            batchId,
            dataHash,
            actionType,
            msg.sender,
            block.timestamp
        );
    }

    function getHistory(string calldata batchId)
        external
        view
        returns (address owner, Action[] memory actions)
    {
        require(batches[batchId].exists, 'Batch does not exist');
        Batch storage b = batches[batchId];
        return (b.owner, b.actions);
    }

    function verifyAction(
        string calldata batchId,
        uint256 index,
        bytes32 dataHash
    ) external view returns (bool matched) {
        require(batches[batchId].exists, 'Batch does not exist');
        require(index < batches[batchId].actions.length, 'Index out of bounds');

        return batches[batchId].actions[index].dataHash == dataHash;
    }

    function getActionCount(string calldata batchId)
        external
        view
        returns (uint256 count)
    {
        require(batches[batchId].exists, 'Batch does not exist');
        return batches[batchId].actions.length;
    }

    function batchExists(string calldata batchId)
        external
        view
        returns (bool)
    {
        return batches[batchId].exists;
    }

    function getBatchOwner(string calldata batchId)
        external
        view
        returns (address)
    {
        require(batches[batchId].exists, 'Batch does not exist');
        return batches[batchId].owner;
    }
}
