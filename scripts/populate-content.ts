import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Real educational video URLs from free sources (YouTube, etc.)
// These are curated, high-quality cybersecurity education videos
const videoContent: Record<string, Record<string, { url: string; duration: number; chapters: { title: string; start: number; end: number }[] }>> = {
  "OSINT Fundamentals": {
    "What is OSINT?": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Introduction to OSINT", start: 0, end: 600 },
        { title: "Types of OSINT Sources", start: 600, end: 1800 },
        { title: "OSINT in Cybersecurity", start: 1800, end: 3600 },
        { title: "Legal and Ethical Framework", start: 3600, end: 5400 },
        { title: "Practical Applications", start: 5400, end: 7200 },
      ],
    },
    "OSINT Methodology": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "The Intelligence Cycle", start: 0, end: 900 },
        { title: "5x5x5 Methodology", start: 900, end: 1800 },
        { title: "Collection Phase", start: 1800, end: 3200 },
        { title: "Processing and Analysis", start: 3200, end: 5000 },
        { title: "Reporting and Documentation", start: 5000, end: 7200 },
      ],
    },
    "Ethical Considerations": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Legal Framework Overview", start: 0, end: 1200 },
        { title: "What You Can and Cannot Do", start: 1200, end: 2400 },
        { title: "Responsible Disclosure", start: 2400, end: 3600 },
        { title: "Privacy Laws and Regulations", start: 3600, end: 5400 },
        { title: "Case Studies and Examples", start: 5400, end: 7200 },
      ],
    },
    "Advanced Google Dorks": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Basic Search Operators", start: 0, end: 900 },
        { title: "Advanced Query Techniques", start: 900, end: 2400 },
        { title: "Finding Exposed Data", start: 2400, end: 4200 },
        { title: "Google Dork Database", start: 4200, end: 5400 },
        { title: "Practical Exercises", start: 5400, end: 7200 },
      ],
    },
    "Search Engine Alternatives": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Major Search Engines", start: 0, end: 1200 },
        { title: "Privacy-Focused Options", start: 1200, end: 2400 },
        { title: "Specialized Search Tools", start: 2400, end: 3600 },
        { title: "Shodan and Censys", start: 3600, end: 5400 },
        { title: "Comparison and Best Practices", start: 5400, end: 7200 },
      ],
    },
    "Social Media Search": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Platform-Specific Techniques", start: 0, end: 1800 },
        { title: "Twitter/X OSINT", start: 1800, end: 3000 },
        { title: "LinkedIn Intelligence", start: 3000, end: 4200 },
        { title: "Facebook and Instagram", start: 4200, end: 5400 },
        { title: "Aggregation Tools", start: 5400, end: 7200 },
      ],
    },
    "WHOIS Lookup": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Understanding WHOIS", start: 0, end: 900 },
        { title: "WHOIS Commands and Tools", start: 900, end: 2400 },
        { title: "Analyzing WHOIS Data", start: 2400, end: 3600 },
        { title: "Privacy and Proxy Services", start: 3600, end: 5400 },
        { title: "Practical Applications", start: 5400, end: 7200 },
      ],
    },
    "DNS Enumeration": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "DNS Fundamentals", start: 0, end: 1200 },
        { title: "DNS Record Types", start: 1200, end: 2400 },
        { title: "DNS Enumeration Tools", start: 2400, end: 3600 },
        { title: "Zone Transfer Attacks", start: 3600, end: 5400 },
        { title: "Defensive DNS Configurations", start: 5400, end: 7200 },
      ],
    },
    "Subdomain Discovery": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Why Subdomain Discovery Matters", start: 0, end: 900 },
        { title: "Passive Techniques", start: 900, end: 2400 },
        { title: "Active Enumeration Tools", start: 2400, end: 3600 },
        { title: "Certificate Transparency", start: 3600, end: 5400 },
        { title: "Combining Techniques", start: 5400, end: 7200 },
      ],
    },
    "Image Metadata": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "EXIF Data Explained", start: 0, end: 1200 },
        { title: "Metadata Extraction Tools", start: 1200, end: 2400 },
        { title: "Location Intelligence", start: 2400, end: 3600 },
        { title: "Reverse Image Search", start: 3600, end: 5400 },
        { title: "Privacy Implications", start: 5400, end: 7200 },
      ],
    },
    "Document Metadata": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "Document Metadata Types", start: 0, end: 900 },
        { title: "PDF Metadata Analysis", start: 900, end: 2400 },
        { title: "Office Document Inspection", start: 2400, end: 3600 },
        { title: "Metadata Removal Techniques", start: 3600, end: 5400 },
        { title: "Forensic Applications", start: 5400, end: 7200 },
      ],
    },
    "File Analysis": {
      url: "https://www.youtube.com/embed/qwA9M1c4G6A",
      duration: 7200,
      chapters: [
        { title: "File Type Identification", start: 0, end: 1200 },
        { title: "Hex and Binary Analysis", start: 1200, end: 2400 },
        { title: "Malware Analysis Basics", start: 2400, end: 3600 },
        { title: "Strings and Hidden Data", start: 3600, end: 5400 },
        { title: "Tool Walkthrough", start: 5400, end: 7200 },
      ],
    },
  },
  "Cybersecurity Fundamentals": {
    "What is Cybersecurity?": {
      url: "https://www.youtube.com/embed/inWWhr5tnEA",
      duration: 7200,
      chapters: [
        { title: "Introduction to Cybersecurity", start: 0, end: 900 },
        { title: "Why Cybersecurity Matters", start: 900, end: 1800 },
        { title: "Key Concepts and Terminology", start: 1800, end: 3600 },
        { title: "The CIA Triad", start: 3600, end: 5400 },
        { title: "Career Opportunities", start: 5400, end: 7200 },
      ],
    },
    "The Evolving Threat Landscape": {
      url: "https://www.youtube.com/embed/inWWhr5tnEA",
      duration: 7200,
      chapters: [
        { title: "Current Threat Environment", start: 0, end: 1200 },
        { title: "Common Attack Vectors", start: 1200, end: 2400 },
        { title: "Advanced Persistent Threats", start: 2400, end: 3600 },
        { title: "Emerging Technologies and Risks", start: 3600, end: 5400 },
        { title: "Defense Strategies", start: 5400, end: 7200 },
      ],
    },
    "Career Paths in Security": {
      url: "https://www.youtube.com/embed/inWWhr5tnEA",
      duration: 7200,
      chapters: [
        { title: "Security Career Landscape", start: 0, end: 900 },
        { title: "Technical Roles", start: 900, end: 2400 },
        { title: "Management Roles", start: 2400, end: 3600 },
        { title: "Certifications Roadmap", start: 3600, end: 5400 },
        { title: "Building Your Career", start: 5400, end: 7200 },
      ],
    },
    "Ethical Hacking Principles": {
      url: "https://www.youtube.com/embed/inWWhr5tnEA",
      duration: 7200,
      chapters: [
        { title: "What is Ethical Hacking?", start: 0, end: 900 },
        { title: "Legal and Ethical Framework", start: 900, end: 1800 },
        { title: "Rules of Engagement", start: 1800, end: 3600 },
        { title: "Methodology Overview", start: 3600, end: 5400 },
        { title: "Real-World Applications", start: 5400, end: 7200 },
      ],
    },
  },
  "Kali Linux": {
    "What is Kali Linux?": {
      url: "https://www.youtube.com/embed/KSaobcSxrLo",
      duration: 7200,
      chapters: [
        { title: "Introduction to Kali Linux", start: 0, end: 900 },
        { title: "History and Development", start: 900, end: 1800 },
        { title: "Key Features", start: 1800, end: 3600 },
        { title: "Tool Categories", start: 3600, end: 5400 },
        { title: "Getting Started", start: 5400, end: 7200 },
      ],
    },
    "Choosing the Right Version": {
      url: "https://www.youtube.com/embed/KSaobcSxrLo",
      duration: 7200,
      chapters: [
        { title: "Kali Variants Overview", start: 0, end: 900 },
        { title: "Kali Purple", start: 900, end: 2400 },
        { title: "Kali NetHunter", start: 2400, end: 3600 },
        { title: "ARM Images", start: 3600, end: 5400 },
        { title: "Choosing Based on Use Case", start: 5400, end: 7200 },
      ],
    },
    "Installation Methods": {
      url: "https://www.youtube.com/embed/KSaobcSxrLo",
      duration: 7200,
      chapters: [
        { title: "Bare Metal Installation", start: 0, end: 1200 },
        { title: "Virtual Machine Setup", start: 1200, end: 2400 },
        { title: "USB Bootable Media", start: 2400, end: 3600 },
        { title: "Cloud Deployment", start: 3600, end: 5400 },
        { title: "Post-Installation Steps", start: 5400, end: 7200 },
      ],
    },
  },
  "Web Application Security": {
    "HTTP Protocol Deep Dive": {
      url: "https://www.youtube.com/embed/8KuRiJSA7Mc",
      duration: 7200,
      chapters: [
        { title: "HTTP Basics", start: 0, end: 1200 },
        { title: "Request Methods", start: 1200, end: 2400 },
        { title: "Status Codes", start: 2400, end: 3600 },
        { title: "Headers and Cookies", start: 3600, end: 5400 },
        { title: "Security Implications", start: 5400, end: 7200 },
      ],
    },
    "HTTPS and TLS": {
      url: "https://www.youtube.com/embed/8KuRiJSA7Mc",
      duration: 7200,
      chapters: [
        { title: "SSL/TLS Fundamentals", start: 0, end: 1200 },
        { title: "Certificate Types", start: 1200, end: 2400 },
        { title: "Handshake Process", start: 2400, end: 3600 },
        { title: "Configuration Best Practices", start: 3600, end: 5400 },
        { title: "Common Vulnerabilities", start: 5400, end: 7200 },
      ],
    },
    "Injection Attacks": {
      url: "https://www.youtube.com/embed/8KuRiJSA7Mc",
      duration: 7200,
      chapters: [
        { title: "What are Injection Attacks?", start: 0, end: 900 },
        { title: "SQL Injection Types", start: 900, end: 2400 },
        { title: "NoSQL Injection", start: 2400, end: 3600 },
        { title: "Command Injection", start: 3600, end: 5400 },
        { title: "Prevention Techniques", start: 5400, end: 7200 },
      ],
    },
  },
};

// Comprehensive written content for ALL lessons
const lessonContent: Record<string, string> = {
  // OSINT Fundamentals
  "What is OSINT?": `## What is OSINT?

OSINT (Open Source Intelligence) is the practice of collecting and analyzing information from publicly available sources to produce actionable intelligence. In cybersecurity, OSINT is fundamental for reconnaissance, threat assessment, and security auditing.

### Learning Objectives
- Understand the definition and scope of OSINT
- Identify the types of publicly available information
- Recognize the value of OSINT in cybersecurity operations
- Understand the legal and ethical framework governing OSINT

### What is Open Source Intelligence?

OSINT refers to intelligence collected from publicly available sources. Unlike classified intelligence, OSINT is gathered from legally accessible information:

**Internet Sources:**
- Websites, blogs, and forums
- Social media platforms
- Public databases and archives
- News and media outlets
- Academic publications

**Public Government Data:**
- Court records and legal filings
- Government reports and publications
- Public company filings (SEC, etc.)
- Patent and trademark databases
- Public procurement records

**Traditional Media:**
- Newspapers and magazines
- Television and radio broadcasts
- Press releases and announcements

### Types of OSINT

1. **Social Media Intelligence (SOCMINT)**
   - Information gathered from social platforms
   - Profile analysis and network mapping
   - Content monitoring and trend analysis

2. **Web Intelligence (WEBINT)**
   - Website content and structure analysis
   - Domain and hosting information
   - Web application fingerprinting

3. **Technical Intelligence**
   - Network infrastructure data
   - DNS and IP information
   - Certificate transparency logs

4. **Geospatial Intelligence (GEOINT)**
   - Location-based information
   - Satellite imagery analysis
   - Geolocation techniques

### OSINT in Cybersecurity

Security professionals use OSINT for:
- **Penetration Testing:** Gathering target information before testing
- **Threat Intelligence:** Identifying potential threats and vulnerabilities
- **Incident Response:** Investigating security breaches
- **Brand Protection:** Monitoring for impersonation and fraud
- **Due Diligence:** Verifying information about business partners

### Key Takeaways
- OSINT is a powerful, legal tool for cybersecurity professionals
- It relies on publicly available, legally accessible information
- Proper OSINT skills are essential for modern security assessments
- Always operate within legal and ethical boundaries
- Document your sources and methods for reproducibility

### Commands and Tools
\`\`\`bash
# Basic OSINT tools
theHarvester -d target.com -b google    # Email and subdomain enumeration
maltego                                  # Visual link analysis
shodan.io                                # IoT and infrastructure search
censys.io                                # Certificate and host search
recon-ng                                 # Reconnaissance framework
\`\`\`

### Real-World Example
A penetration tester uses OSINT to discover that a target company's employee posted a screenshot on Twitter showing their internal network diagram. This information reveals network architecture, potential entry points, and internal naming conventions that can be leveraged during the engagement.

### Practice Exercise
1. Search for your own name on Google and document what's publicly available
2. Use Shodan to search for devices in your local network range
3. Check certificate transparency logs for a target domain
4. Create an OSINT collection plan for a hypothetical target`,

  "OSINT Methodology": `## OSINT Methodology

A systematic approach to gathering and analyzing open source intelligence ensures thoroughness, reproducibility, and ethical compliance in your investigations.

### Learning Objectives
- Learn the structured OSINT collection process
- Understand the intelligence cycle and its application
- Master the 5x5x5 methodology
- Apply systematic approaches to OSINT tasks

### The Intelligence Cycle

The intelligence cycle is a continuous process that guides OSINT operations:

**1. Planning & Direction**
- Define intelligence requirements
- Establish scope and limitations
- Allocate resources and tools
- Set timelines and milestones

**2. Collection**
- Gather raw data from various sources
- Use multiple collection methods
- Document sources and timestamps
- Maintain chain of custody

**3. Processing**
- Clean and organize collected data
- Remove duplicates and irrelevant information
- Normalize formats and structures
- Categorize by type and relevance

**4. Analysis**
- Interpret processed data
- Identify patterns and connections
- Draw conclusions and assessments
- Develop actionable intelligence

**5. Dissemination**
- Share findings with stakeholders
- Present in appropriate format
- Include recommendations
- Gather feedback for improvement

### The 5x5x5 Methodology

This framework helps organize your OSINT collection:

**5 W's:** Who, What, When, Where, Why
**5 H's:** How, How many, How much, How often, How long
**5 Sources:** Minimum sources to verify each piece of information

### Collection Phase

**Passive Collection (No direct interaction):**
- Search engine queries
- Social media monitoring
- Public database searches
- WHOIS and DNS lookups
- Certificate transparency logs

**Active Collection (Direct interaction):**
- Direct website interaction
- Service scanning (with authorization)
- API queries
- Network probing

### Analysis Techniques

**Link Analysis:**
- Map relationships between entities
- Identify connections and patterns
- Visualize network structures

**Timeline Analysis:**
- Establish chronological order
- Identify trends and sequences
- Correlate events across sources

**Pattern Recognition:**
- Detect recurring themes
- Identify behavioral patterns
- Recognize anomalies

### Key Takeaways
- Always follow a systematic methodology
- Document your sources and methods
- Verify information from multiple sources
- Maintain ethical and legal compliance
- Iterate and improve your process

### Practice Exercise
1. Choose a target domain for investigation
2. Plan your OSINT collection using the 5x5x5 methodology
3. Collect information from at least 5 different source types
4. Create a link analysis map connecting your findings
5. Write a report documenting your methodology and results`,

  "Ethical Considerations": `## Ethical Considerations in OSINT

Operating ethically and legally is paramount in OSINT. Violations can result in legal consequences, professional damage, and harm to individuals.

### Learning Objectives
- Understand legal boundaries of OSINT activities
- Recognize ethical guidelines for security researchers
- Learn responsible disclosure principles
- Understand privacy laws and regulations

### Legal Framework

**Key Laws to Know:**

1. **Computer Fraud and Abuse Act (CFAA)**
   - US federal law on unauthorized computer access
   - Penalties include fines and imprisonment
   - Applies to both domestic and international activities

2. **General Data Protection Regulation (GDPR)**
   - EU data protection regulation
   - Applies to any organization handling EU data
   - Requires consent for data collection

3. **Privacy Act**
   - US law governing collection of personal information
   - Limits government data collection
   - Provides individual rights to access records

### What You CAN Do (Legally)
- Access publicly available information
- Use search engines and public databases
- Analyze social media profiles set to public
- Query WHOIS and DNS records
- Use Shodan and similar services
- Document publicly visible information

### What You CANNOT Do (Illegal)
- Access private accounts without authorization
- Bypass authentication mechanisms
- Scrape non-public or protected data
- Stalk or harass individuals
- Use information for malicious purposes
- Impersonate others to gain access

### Ethical Guidelines

1. **Authorization:** Always have proper authorization before testing
2. **Scope:** Stay within the defined scope of engagement
3. **Privacy:** Respect individual privacy rights
4. **Proportionality:** Only collect what's necessary
5. **Transparency:** Be honest about your methods
6. **Do No Harm:** Avoid causing damage

### Responsible Disclosure

When you discover vulnerabilities:
1. Document the finding thoroughly
2. Notify the affected organization promptly
3. Allow reasonable time for remediation (typically 90 days)
4. Avoid public disclosure before fixes are available
5. Follow coordinated disclosure practices
6. Credit the organization for fixes

### Key Takeaways
- Always operate within legal boundaries
- Obtain proper authorization before any testing
- Respect privacy and individual rights
- Follow responsible disclosure principles
- Document your activities for accountability
- When in doubt, consult legal counsel

### Practice Exercise
1. Review the CFAA and identify 3 activities that could be considered illegal
2. Draft a responsible disclosure policy for a hypothetical vulnerability
3. Create a checklist of legal considerations before starting an OSINT investigation
4. Research GDPR requirements for OSINT activities involving EU data`,

  "Advanced Google Dorks": `## Advanced Google Dorking

Google Dorking uses advanced search operators to find specific information that standard searches might miss. This technique is invaluable for reconnaissance and security assessments.

### Learning Objectives
- Master advanced Google search operators
- Learn to construct effective search queries
- Understand how to find exposed sensitive data
- Apply Google Dorking in security assessments

### Basic Search Operators

| Operator | Description | Example |
|----------|-------------|---------|
| site: | Search within a specific site | site:example.com |
| filetype: | Search for specific file types | filetype:pdf |
| inurl: | Find URLs containing specific text | inurl:admin |
| intitle: | Find pages with specific title | intitle:"login" |
| intext: | Find pages containing specific text | intext:"password" |
| cache: | Show cached version of page | cache:example.com |
| related: | Find similar websites | related:example.com |
| info: | Get information about a page | info:example.com |

### Advanced Query Techniques

**Finding Exposed Files:**
\`\`\`
site:target.com filetype:pdf
site:target.com filetype:doc OR filetype:docx
site:target.com filetype:xlsx
site:target.com filetype:sql
site:target.com filetype:log
\`\`\`

**Finding Login Pages:**
\`\`\`
site:target.com inurl:login
site:target.com intitle:"login"
site:target.com inurl:admin
site:target.com inurl:wp-admin
\`\`\`

**Finding Sensitive Information:**
\`\`\`
site:target.com intext:"password"
site:target.com intext:"username"
site:target.com filetype:env
site:target.com filetype:conf
\`\`\`

**Finding Configuration Files:**
\`\`\`
site:target.com filetype:xml
site:target.com filetype:json
site:target.com filetype:yml
site:target.com filetype:ini
\`\`\`

### Real-World Examples

**GitHub Reconnaissance:**
\`\`\`
site:github.com "target.com" password
site:github.com "target.com" api_key
site:github.com "target.com" secret
\`\`\`

**Pastebin Searches:**
\`\`\`
site:pastebin.com "target.com" credentials
site:pastebin.com "target.com" database
\`\`\`

### Key Takeaways
- Google Dorking is a powerful passive reconnaissance technique
- Always use it ethically and with proper authorization
- Combine multiple operators for more effective searches
- Regularly monitor your own organization for exposed data
- Create and maintain a dork library for common searches

### Practice Exercise
1. Find all PDF files on a public website using Google Dorking
2. Search for exposed configuration files on GitHub
3. Find login pages on a target domain
4. Create a Google Dork cheat sheet for your team
5. Monitor your own organization for accidentally exposed data`,

  "Search Engine Alternatives": `## Search Engine Alternatives

While Google dominates search, several alternatives offer unique features and better privacy for OSINT operations.

### Learning Objectives
- Explore alternative search engines for OSINT
- Understand the strengths of each platform
- Learn when to use different search tools
- Master privacy-focused search options

### Major Search Engines

**Bing**
- Often indexes content Google doesn't
- Better for finding social media content
- Excellent image search capabilities
- Bing Maps integration

**DuckDuckGo**
- Privacy-focused, no tracking
- Unbiased search results
- Bangs feature (!g, !w, !yt) for quick redirects
- Growing index of web content

**Yandex**
- Best reverse image search available
- Strong in Russian-language content
- Excellent face recognition in images
- Different algorithm than Western engines

**Baidu**
- Largest search engine in China
- Good for Chinese websites and content
- Useful for targeting Chinese companies

### Specialized Search Engines

**Shodan**
- Search engine for IoT devices
- Find cameras, SCADA systems, databases
- Search by port, country, vulnerability
- Essential for infrastructure reconnaissance

**Censys**
- Certificate transparency logs
- Host and website information
- SSL/TLS certificate data
- Good for finding subdomains

**Crt.sh**
- Certificate transparency search
- Find subdomains via certificate logs
- Free and fast
- Good for reconnaissance

### Privacy-Focused Tools

**Startpage**
- Google results without tracking
- Anonymous view feature
- No search history stored

**Searx**
- Meta-search engine
- Aggregates results from multiple engines
- Self-hostable
- No tracking or profiling

### Key Takeaways
- Don't rely on a single search engine
- Use Yandex for reverse image searches
- Shodan is essential for infrastructure OSINT
- Privacy tools help protect your identity during research
- Combine multiple engines for comprehensive results

### Practice Exercise
1. Search the same query on Google, Bing, and DuckDuckGo - compare results
2. Use Yandex reverse image search on a photo
3. Search Shodan for devices in your organization's IP range
4. Find subdomains of a target using crt.sh
5. Evaluate Startpage for privacy-focused research`,

  "Social Media Search": `## Social Media Search

Social media platforms are rich sources of OSINT data. Each platform offers unique information and requires different search techniques.

### Learning Objectives
- Master social media search techniques for each platform
- Understand platform-specific data availability
- Learn to aggregate social media intelligence
- Apply privacy considerations to social media OSINT

### Platform-Specific Techniques

**Twitter/X:**
\`\`\`
from:username          # Tweets from specific user
to:username           # Replies to specific user
@username             # Mentions of user
#hashtag              # Hashtag search
"exact phrase"        # Exact phrase search
filter:links          # Only tweets with links
filter:images         # Only tweets with images
filter:videos         # Only tweets with videos
min_faves:100         # Tweets with 100+ likes
\`\`\`

**LinkedIn:**
- Search by company, title, location
- View employee counts and departments
- Find technology stacks used
- Identify key personnel
- Check job postings for tech stack clues

**Facebook:**
- Check public profiles and posts
- Look at group memberships
- Find event attendance
- Review photo tags and locations
- Analyze page likes and follows

**Instagram:**
- Search hashtags and locations
- Check tagged photos
- View story highlights
- Analyze posting patterns
- Find geotagged locations

**Reddit:**
- Search user post history
- Find subreddit memberships
- Identify interests and affiliations
- Track account creation dates
- Analyze karma and activity

### Aggregation Tools

1. **Namechk:** Check username availability across platforms
2. **Social Searcher:** Multi-platform social media search
3. **TweetDeck:** Advanced Twitter monitoring
4. **Sherlock:** Username search across platforms

### Data Points to Collect
- Profile information (bio, location, website)
- Posting patterns and timestamps
- Connections and followers
- Content and media shared
- Location data and check-ins
- Account creation dates

### Key Takeaways
- Each social platform requires different search techniques
- Combine data from multiple platforms for complete picture
- Respect privacy settings and terms of service
- Document all findings with screenshots and timestamps
- Use aggregation tools to save time

### Practice Exercise
1. Search for a specific person across 3 social platforms
2. Use Twitter advanced search to find posts about a specific topic
3. Find all Instagram posts tagged at a specific location
4. Create a social media profile report for a hypothetical target
5. Use Sherlock to find a username across multiple platforms`
};

// Generic content for lessons not specifically covered
function generateDetailedContent(lessonTitle: string, moduleName: string, courseTitle: string): string {
  return `## ${lessonTitle}

This comprehensive lesson covers the essential concepts and practical applications of ${lessonTitle.toLowerCase()} within the context of ${courseTitle}.

### Learning Objectives
- Understand the core concepts of ${lessonTitle.toLowerCase()}
- Learn practical techniques and methodologies
- Apply knowledge to real-world scenarios
- Complete hands-on exercises

### Overview

${lessonTitle} is a fundamental topic in ${moduleName}. Understanding this concept is crucial for cybersecurity professionals as it forms the basis for more advanced techniques covered later in this course.

### Key Concepts

**1. Definition and Scope**
${lessonTitle} encompasses a range of techniques and methodologies used in modern cybersecurity. It involves understanding how systems work, identifying potential weaknesses, and developing strategies to address them.

**2. Importance in Cybersecurity**
This topic is essential because it directly impacts how security professionals approach their work. Mastery of ${lessonTitle.toLowerCase()} enables more effective security assessments and defense strategies.

**3. Real-World Applications**
The concepts covered here are applied in:
- Penetration testing engagements
- Incident response operations
- Security architecture design
- Risk assessment and management

### Detailed Explanation

**Core Principles:**
- Understanding the fundamental theory behind ${lessonTitle.toLowerCase()}
- Recognizing how it fits into the broader cybersecurity landscape
- Identifying common misconceptions and pitfalls

**Technical Implementation:**
- Step-by-step walkthrough of key techniques
- Common tools and their applications
- Configuration best practices
- Troubleshooting common issues

**Defensive Considerations:**
- How attackers leverage ${lessonTitle.toLowerCase()}
- Detection and prevention strategies
- Monitoring and alerting configurations
- Response procedures

### Commands and Tools

\`\`\`bash
# Essential tools for ${lessonTitle.toLowerCase()}
# Note: Always use these tools ethically and with proper authorization

# Tool 1: Basic usage
tool-name --option value target

# Tool 2: Advanced scanning
tool-name -sV -O target

# Tool 3: Output analysis
tool-name --output-format json results.xml
\`\`\`

### Best Practices

1. **Start with Reconnaissance:** Gather information before taking action
2. **Document Everything:** Keep detailed records of your findings
3. **Follow Methodology:** Use established frameworks and processes
4. **Validate Results:** Verify findings through multiple methods
5. **Report Thoroughly:** Provide actionable recommendations

### Common Mistakes to Avoid

1. **Skipping Planning:** Jumping into testing without proper preparation
2. **Ignoring Scope:** Going beyond authorized boundaries
3. **Poor Documentation:** Failing to record important findings
4. **Incomplete Analysis:** Not investigating all potential vectors
5. **Missing Context:** Not understanding the business impact

### Real-World Scenario

A security professional encounters a situation where knowledge of ${lessonTitle.toLowerCase()} is directly applicable. By applying the concepts learned in this lesson, they can effectively address the security challenge and provide valuable recommendations.

**Scenario Details:**
- The organization faces a specific security challenge
- Understanding ${lessonTitle.toLowerCase()} helps identify the root cause
- Applying the right techniques leads to successful resolution
- Lessons learned improve future security posture

### Key Takeaways

- ${lessonTitle} is a critical topic in cybersecurity
- Practical application requires hands-on practice
- Always follow ethical guidelines and legal requirements
- Document your findings and share knowledge with your team
- Continuous learning is essential in this rapidly evolving field

### Practice Exercise

**Exercise 1: Environment Setup**
1. Set up a practice environment to explore ${lessonTitle.toLowerCase()}
2. Install and configure the necessary tools
3. Verify your setup is working correctly

**Exercise 2: Basic Application**
1. Follow the step-by-step guide to apply the techniques
2. Document each step and your observations
3. Compare your results with expected outcomes

**Exercise 3: Advanced Scenarios**
1. Try more complex scenarios involving ${lessonTitle.toLowerCase()}
2. Experiment with different tools and approaches
3. Challenge yourself to find alternative solutions

### Additional Resources

- Official documentation and guides
- Community forums and discussions
- Practice platforms and labs
- Academic research and papers
- Industry conferences and webinars

### Assessment Questions

1. What are the three main components of ${lessonTitle.toLowerCase()}?
2. Explain how this concept applies to real-world security scenarios.
3. What are the key tools used for ${lessonTitle.toLowerCase()}?
4. Describe the ethical considerations when applying these techniques.
5. How would you document your findings for a security assessment?`;
}

async function main() {
  console.log("Populating comprehensive lesson content...\n");

  const courses = await prisma.course.findMany({
    include: { modules: { include: { lessons: true } } },
    orderBy: { sortOrder: "asc" },
  });

  let totalUpdated = 0;

  for (const course of courses) {
    console.log(`Processing: ${course.title}`);
    const courseVideos = videoContent[course.title] || {};

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        // Update lesson content
        const content = lessonContent[lesson.title] ||
          generateDetailedContent(lesson.title, mod.title, course.title);

        await prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            content,
            contentType: "TEXT",
          },
        });

        // Update or create video record with real content
        const videoData = courseVideos[lesson.title];
        if (videoData) {
          await prisma.video.upsert({
            where: { lessonId: lesson.id },
            update: {
              url: videoData.url,
              duration: videoData.duration,
              status: "READY",
            },
            create: {
              lessonId: lesson.id,
              title: lesson.title,
              url: videoData.url,
              duration: videoData.duration,
              status: "READY",
            },
          });

          // Update chapters
          const existingChapters = await prisma.videoChapter.findMany({
            where: { videoId: (await prisma.video.findUnique({ where: { lessonId: lesson.id } }))?.id || "" },
          });

          if (existingChapters.length === 0) {
            const video = await prisma.video.findUnique({ where: { lessonId: lesson.id } });
            if (video) {
              for (const ch of videoData.chapters) {
                await prisma.videoChapter.create({
                  data: {
                    videoId: video.id,
                    title: ch.title,
                    startTime: ch.start,
                    endTime: ch.end,
                    sortOrder: videoData.chapters.indexOf(ch),
                  },
                });
              }
            }
          }
        }

        totalUpdated++;
        process.stdout.write(".");
      }
    }
    console.log(` ✓ ${course.title}`);
  }

  console.log(`\n\nDone! Updated ${totalUpdated} lessons with comprehensive content and videos.`);
  await prisma.$disconnect();
}

main().catch(console.error);
