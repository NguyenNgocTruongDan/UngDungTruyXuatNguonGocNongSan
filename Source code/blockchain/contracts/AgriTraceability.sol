// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgriTraceability {
    struct TraceEvent {
        string actionType;
        uint64 timestamp;
        address actor;
        bytes32 dataHash;
    }

    mapping(string => TraceEvent[]) private traces;

    event EventRecorded(
        string indexed batchId,
        string actionType,
        bytes32 indexed dataHash,
        address indexed actor,
        uint256 timestamp
    );

    event BatchTouched(string indexed batchId, uint256 totalEvents);

    function recordEvent(
        string calldata batchId,
        string calldata actionType,
        bytes32 dataHash
    ) external {
        require(bytes(batchId).length > 0, 'batchId is required');
        require(bytes(actionType).length > 0, 'actionType is required');
        require(dataHash != bytes32(0), 'dataHash is required');

        traces[batchId].push(
            TraceEvent({
                actionType: actionType,
                timestamp: uint64(block.timestamp),
                actor: msg.sender,
                dataHash: dataHash
            })
        );

        emit EventRecorded(
            batchId,
            actionType,
            dataHash,
            msg.sender,
            block.timestamp
        );

        emit BatchTouched(batchId, traces[batchId].length);
    }

    function getTraceCount(string calldata batchId)
        external
        view
        returns (uint256)
    {
        return traces[batchId].length;
    }

    function getTraceAt(string calldata batchId, uint256 index)
        external
        view
        returns (TraceEvent memory)
    {
        require(index < traces[batchId].length, 'index out of bounds');
        return traces[batchId][index];
    }

    function getTraceHistory(string calldata batchId)
        external
        view
        returns (TraceEvent[] memory timeline)
    {
        return traces[batchId];
    }
}
