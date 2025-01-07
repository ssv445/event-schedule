class FairSchedule {
    constructor() {
        this.events = [];
        this.isAdminMode = new URLSearchParams(window.location.search).get('mode') === 'admin';
        this.init();
    }

    async init() {
        try {
            await this.loadEvents();
            this.setupSearch();
            this.setupEventListeners();
            this.renderEvents();
            this.startTimeUpdates();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async loadEvents() {
        try {
            const response = await $.ajax({
                url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRp22KQAC4hs9_NGWEOyQ8i6JyHwspWz1jTPr_uLci9LIBvj7m4-RdrN6MwKXOhW0RI0g0M09qFtJhm/pub?gid=0&single=true&output=tsv',
                dataType: 'text'
            });
            this.events = this.parseTSV(response);
            console.log(this.events);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    parseTSV(tsv) {
        const lines = tsv.split('\n');
        const headers = lines[0].split('\t').map(header => header.trim());
        return lines.slice(1).map(line => {
            const values = line.split('\t').map(value => value.trim());
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {});
        });
    }

    setupSearch() {
        this.searchInput = $('#searchInput');
    }

    setupEventListeners() {
        this.searchInput.on('input', () => this.filterEvents());
        
        $(document).on('click', '.toggle-details', function() {
            const $details = $(this).next('.programme-details');
            const $icon = $(this).find('.toggle-icon');
            const $text = $(this).find('.toggle-text');
            
            $details.toggleClass('expanded');
            if ($details.hasClass('expanded')) {
                $icon.text('▲');
                $text.text('Hide Details');
            } else {
                $icon.text('▼');
                $text.text('Show Details');
            }
        });
    }

    isEventCurrent(event) {
        const now = new Date();
        const startTime = new Date(`${event.date} ${event.timeStart}`);
        const endTime = new Date(`${event.date} ${event.timeEnd}`);
        return now >= startTime && now <= endTime;
    }

    isEventFinished(event) {
        const now = new Date();
        const endTime = new Date(`${event.date} ${event.timeEnd}`);
        return now > endTime;
    }

    filterEvents() {
        const searchTerm = this.searchInput.val().toLowerCase();

        this.renderEvents(this.events.filter(event => {
            return Object.values(event).some(value => 
                value.toLowerCase().includes(searchTerm)
            );
        }));
    }

    renderEvents(filteredEvents = this.events) {
        const container = $('#eventsList');
        container.empty();

        const formatTime = (time24) => {
            const [hours, minutes] = time24.split(':');
            let period = 'AM';
            let hours12 = parseInt(hours);
            
            if (hours12 >= 12) {
                period = 'PM';
                if (hours12 > 12) {
                    hours12 -= 12;
                }
            }
            if (hours12 === 0) {
                hours12 = 12;
            }
            
            return `${hours12}:${minutes} ${period}`;
        };

        const eventsByDate = filteredEvents.reduce((acc, event) => {
            if (!acc[event.date]) {
                acc[event.date] = [];
            }
            acc[event.date].push(event);
            return acc;
        }, {});

        Object.keys(eventsByDate).sort().forEach(date => {
            container.append(`
                <div class="col-12 date-header-wrapper">
                    <div class="date-header">${new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                </div>
            `);

            eventsByDate[date].forEach(event => {
                const isCurrent = this.isEventCurrent(event);
                const isFinished = this.isEventFinished(event);

                const parseContactInfo = (text) => {
                    if (!text) return [];
                    return text.split(',').map(contact => {
                        const parts = contact.trim().split('-');
                        return {
                            name: parts[0].trim(),
                            phone: parts.length > 1 ? parts[1].trim() : null
                        };
                    });
                };

                const renderContacts = (contacts) => {
                    return contacts.map(contact => {
                        if (contact.phone) {
                            return `${contact.name} <a href="tel:${contact.phone}" class="contact-phone">${contact.phone}</a>`;
                        }
                        return contact.name;
                    }).join(', ');
                };

                container.append(`
                    <div class="col-12">
                        <div class="event-row ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}">
                            <div class="event-time">${formatTime(event.timeStart)} - ${formatTime(event.timeEnd)}</div>
                            <div class="event-content">
                                <div class="event-header">
                                    <div class="event-main-info">
                                       
                                        <span class="event-name">${event.programmeName}</span>
                                        ${event.programmeDetail1 ? `<div class="event-brief">${event.programmeDetail1}</div>` : ''}
                                        ${isCurrent ? '<span class="now-live">Now Live!</span>' : ''}
                                        ${event.programmeDetail2 ? `<div class="event-detail">${event.programmeDetail2}</div>` : ''}
                                        <div class="event-contacts">
                                            ${event.coordinators ? `
                                                <div class="coordinators">
                                                    <strong>Coordinators:</strong> ${renderContacts(parseContactInfo(event.coordinators))}
                                                </div>
                                            ` : ''}
                                            ${event.volunteers ? `
                                                <div class="volunteers">
                                                    <strong>Volunteers:</strong> ${renderContacts(parseContactInfo(event.volunteers))}
                                                </div>
                                            ` : ''}
                                            ${event.guests ? `
                                                <div class="guests">
                                                    <strong>Guests:</strong> ${event.guests}
                                                </div>
                                            ` : ''}
                                        </div>
                                         ${event.programmeImage ? `
                                            <div class="event-image">
                                                <a href="${event.programmeImage}" target="_blank">
                                                    <img src="${event.programmeImage}" alt="${event.programmeName}">
                                                </a>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    }

    startTimeUpdates() {
        setInterval(() => this.renderEvents(), 60000); // Update every minute
    }
}

$(document).ready(() => {
    new FairSchedule();
}); 