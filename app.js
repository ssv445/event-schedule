class FairSchedule {
    constructor() {
        this.events = [];
        this.init();
    }

    async init() {
        try {
            await this.loadEvents();
            this.setupFilters();
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
                url: './events.csv',
                // url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRp22KQAC4hs9_NGWEOyQ8i6JyHwspWz1jTPr_uLci9LIBvj7m4-RdrN6MwKXOhW0RI0g0M09qFtJhm/pub?output=csv',
                dataType: 'text'
            });
            this.events = this.parseCSV(response);
            this.updateProgramTypeOptions();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
        return lines.slice(1).map(line => {
            // Match CSV fields, handling quoted values with potential commas inside
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                .map(value => value.replace(/"/g, '').trim());
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {});
        });
    }

    setupFilters() {
        this.searchInput = $('#searchInput');
        this.programTypeFilter = $('#programTypeFilter');
        this.dateFilter = $('#dateFilter');
    }

    setupEventListeners() {
        this.searchInput.on('input', () => this.filterEvents());
        this.programTypeFilter.on('change', () => this.filterEvents());
        this.dateFilter.on('change', () => this.filterEvents());
        
        $(document).on('click', '.toggle-details', function() {
            $(this).next('.programme-details').toggleClass('expanded');
        });
    }

    updateProgramTypeOptions() {
        const types = [...new Set(this.events.map(event => event.programType))];
        types.forEach(type => {
            this.programTypeFilter.append(`<option value="${type}">${type}</option>`);
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
        const programType = this.programTypeFilter.val();
        const dateFilter = this.dateFilter.val();

        this.renderEvents(this.events.filter(event => {
            const matchesSearch = Object.values(event).some(value => 
                value.toLowerCase().includes(searchTerm)
            );
            const matchesType = !programType || event.programType === programType;
            const matchesDate = !dateFilter || event.date === dateFilter;
            return matchesSearch && matchesType && matchesDate;
        }));
    }

    renderEvents(filteredEvents = this.events) {
        const container = $('#eventsList');
        container.empty();

        filteredEvents.forEach(event => {
            const isCurrent = this.isEventCurrent(event);
            const isFinished = this.isEventFinished(event);

            const card = $(`
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card event-card ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}">
                        <div class="card-body">
                            <h5 class="card-title">
                                ${event.programmeName}
                                ${isCurrent ? '<span class="now-live">Now Live!</span>' : ''}
                            </h5>
                            <p class="card-text">
                                <strong>Date:</strong> ${event.date}<br>
                                <strong>Time:</strong> ${event.timeStart} - ${event.timeEnd}<br>
                                <strong>Type:</strong> ${event.programType}
                            </p>
                            <div class="toggle-details">Show Details ▼</div>
                            <div class="programme-details">
                                <p>${event.programmeDetail1}</p>
                                <p>${event.programmeDetail2}</p>
                                <p><strong>Participants:</strong> ${event.participants}</p>
                                <p><strong>Guests:</strong> ${event.guests}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            container.append(card);
        });
    }

    startTimeUpdates() {
        setInterval(() => this.renderEvents(), 60000); // Update every minute
    }
}

$(document).ready(() => {
    new FairSchedule();
}); 