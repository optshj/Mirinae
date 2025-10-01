type Events = {
    kind: 'calendar#event'
    etag: string
    id: string
    status: string
    htmlLink: string
    created: Date
    updated: Date
    summary: string
    description: string
    location: string
    colorId: string
    creator: {
        id: string
        email: string
        displayName: string
        self: boolean
    }
    organizer: {
        id: string
        email: string
        displayName: string
        self: boolean
    }
    endTimeUnspecified: boolean
    recurrence: [string]
    recurringEventId: string
    originalStartTime: {
        date: Date
        dateTime: Date
        timeZone: string
    }
    transparency: string
    visibility: string
    iCalUID: string
    sequence: number
    attendees: [
        {
            id: string
            email: string
            displayName: string
            organizer: boolean
            self: boolean
            resource: boolean
            optional: boolean
            responseStatus: string
            comment: string
            additionalGuests: number
        }
    ]
    attendeesOmitted: boolean
    extendedProperties: {
        private: {
            (key): string
        }
        shared: {
            (key): string
        }
    }
    hangoutLink: string
    conferenceData: {
        createRequest: {
            requestId: string
            conferenceSolutionKey: {
                type: string
            }
            status: {
                statusCode: string
            }
        }
        entryPoints: [
            {
                entryPointType: string
                uri: string
                label: string
                pin: string
                accessCode: string
                meetingCode: string
                passcode: string
                password: string
            }
        ]
        conferenceSolution: {
            key: {
                type: string
            }
            name: string
            iconUri: string
        }
        conferenceId: string
        signature: string
        notes: string
    }
    gadget: {
        type: string
        title: string
        link: string
        iconLink: string
        width: number
        height: number
        display: string
        preferences: {
            (key): string
        }
    }
    anyoneCanAddSelf: boolean
    guestsCanInviteOthers: boolean
    guestsCanModify: boolean
    guestsCanSeeOtherGuests: boolean
    privateCopy: boolean
    locked: boolean
    reminders: {
        useDefault: boolean
        overrides: [
            {
                method: string
                minutes: number
            }
        ]
    }
    source: {
        url: string
        title: string
    }
    workingLocationProperties: {
        type: string
        homeOffice: string
        customLocation: {
            label: string
        }
        officeLocation: {
            buildingId: string
            floorId: string
            floorSectionId: string
            deskId: string
            label: string
        }
    }
    outOfOfficeProperties: {
        autoDeclineMode: string
        declineMessage: string
    }
    focusTimeProperties: {
        autoDeclineMode: string
        declineMessage: string
        chatStatus: string
    }
    attachments: [
        {
            fileUrl: string
            title: string
            mimeType: string
            iconLink: string
            fileId: string
        }
    ]
    birthdayProperties: {
        contact: string
        type: string
        customTypeName: string
    }
    eventType: string
}
export type TimeEvent = Events & {
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
}
export type HolidayEvent = Events & {
    start: { date: string }
    end: { date: string }
}
export type AllDayEvent = Events & {
    start: { date: string }
    end: { date: string }
}
export type CalendarEvent = TimeEvent | HolidayEvent | AllDayEvent

export type CalendarEventWithColor = CalendarEvent & {
    color: {
        background: string
        foreground: string
    }
}

// 타입 가드
export function isAllDayEvent(event: CalendarEvent): event is AllDayEvent {
    return 'date' in event.start && event.eventType === 'default'
}

export function isTimeEvent(event: CalendarEvent): event is TimeEvent {
    return 'dateTime' in event.start
}

export function isHolidayEvent(event: CalendarEvent): event is HolidayEvent {
    return event.description === '공휴일'
}
