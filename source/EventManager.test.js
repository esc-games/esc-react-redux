import {initializeStore} from "./ReducerManager";
import {EventManager, HANDLER_GROUP_DEFAULT} from "./EventManager";
import {ReducerManager} from "./ReducerManager";

import React from "react";


const ACTION1 = "action1";
const ACTION2 = "action2";

class MockComponent extends React.Component {
    render() {
        return (<div></div>)
    }
}

const MANAGER1 = "manager1";
const MANAGER2 = "manager2";
const EVENT_NAME1 = "event1";
const EVENT_NAME2 = "event2";
const HANDLER_GROUP_CUSTOM = "fuzzyWhales";

it('HANDLER_GROUP_DEFAULT - is a string', () => {
    expect(typeof HANDLER_GROUP_DEFAULT).toEqual("string");
});

it('EventManager - managerName is set up correctly', () => {
    const eventManager = new EventManager(MANAGER1);
    expect(eventManager.managerName).toEqual(`Manager:${MANAGER1}`);
});

it('EventManager - window.managers is set up correctly', () => {
    new EventManager(MANAGER2);
    expect(window.managers).hasOwnProperty(`Manager:${MANAGER2}`);
});

it('EventManager - propagates stats events when component is connected', () => {
    const store = initializeStore({});
    const eventManager = new EventManager(MANAGER1, createEmptyReducerManager());
    const component = eventManager.connect(MockComponent, [eventManager.ACTION_EVENT_STATS]);
    component.WrappedComponent.prototype.UNSAFE_componentWillMount();
    const events1 = [];
    const events2 = [];
    eventManager.registerEventHandler(EVENT_NAME1, HANDLER_GROUP_DEFAULT, (event) => {
        events1.push(event);
    });
    eventManager.registerEventHandler(EVENT_NAME2, HANDLER_GROUP_CUSTOM, (event) => {
        events2.push(event);
    });
    eventManager.registerEventHandler(EVENT_NAME2, HANDLER_GROUP_DEFAULT, (event) => {
        // noop
    });

    eventManager.registerEventHandler(EVENT_NAME2, HANDLER_GROUP_DEFAULT, (event) => {
        // noop
    });

    eventManager.dispatchEvent(EVENT_NAME1, {
        [EVENT_NAME1]: 1
    });
    eventManager.dispatchRawEvent(`${EVENT_NAME2}:{"${EVENT_NAME2}": 1}`);

    expect(events1.length).toEqual(1);
    expect(events2.length).toEqual(1);
    expect(eventManager.stats.events).hasOwnProperty(EVENT_NAME1);
    expect(eventManager.stats.events[EVENT_NAME1].dispatched).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME1].consumed).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME1]).hasOwnProperty(HANDLER_GROUP_DEFAULT);
    expect(eventManager.stats.events[EVENT_NAME1][HANDLER_GROUP_DEFAULT].dispatched).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME1][HANDLER_GROUP_DEFAULT].consumed).toEqual(1);
    expect(eventManager.stats.events).hasOwnProperty(EVENT_NAME2);
    expect(eventManager.stats.events[EVENT_NAME2].dispatched).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME2].consumed).toEqual(3);
    expect(eventManager.stats.events[EVENT_NAME2]).hasOwnProperty(HANDLER_GROUP_DEFAULT);
    expect(eventManager.stats.events[EVENT_NAME2][HANDLER_GROUP_DEFAULT].dispatched).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME2][HANDLER_GROUP_DEFAULT].consumed).toEqual(2);
    expect(eventManager.stats.events[EVENT_NAME2]).hasOwnProperty(HANDLER_GROUP_CUSTOM);
    expect(eventManager.stats.events[EVENT_NAME2][HANDLER_GROUP_CUSTOM].dispatched).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME2][HANDLER_GROUP_CUSTOM].consumed).toEqual(1);
    expect(eventManager.stats.groups).hasOwnProperty(HANDLER_GROUP_DEFAULT);
    expect(eventManager.stats.groups[HANDLER_GROUP_DEFAULT].dispatched).toEqual(2);
    expect(eventManager.stats.groups[HANDLER_GROUP_DEFAULT].consumed).toEqual(3);

    expect(eventManager.stats).toEqual(store.getState()[eventManager.managerName].eventStats)
});

it('EventManager - propagates stats regardless of listeners', () => {
    const eventManager = new EventManager(MANAGER1, createEmptyReducerManager());
    eventManager.dispatchEvent(EVENT_NAME1, {
        [EVENT_NAME1]: 1
    });
    expect(eventManager.stats.events).hasOwnProperty(EVENT_NAME1);
    expect(eventManager.stats.events[EVENT_NAME1]).hasOwnProperty(HANDLER_GROUP_DEFAULT);
    expect(eventManager.stats.events[EVENT_NAME1].dispatched).toEqual(1);
    expect(eventManager.stats.events[EVENT_NAME1].consumed).toEqual(0);
});

const createEmptyReducerManager = () => {
    return new ReducerManager({});
};

const createReducerCounter = (reducerName) => {
    return (state, action) => {
        return {
            ...state,
            [reducerName]: state[reducerName] ? state[reducerName] + 1 : 1
        }
    }
};
