import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Content templates for each course/lesson combination
const courseContent: Record<string, Record<string, string>> = {
  "OSINT Fundamentals": {
    "What is OSINT?": `## What is OSINT?

OSINT (Open Source Intelligence) is the practice of collecting and analyzing information from publicly available sources to produce actionable intelligence. In cybersecurity, OSINT is used for reconnaissance, threat assessment, and security auditing.

### Learning Objectives
- Understand the definition and scope of OSINT
- Identify the types of publicly available information
- Recognize the value of OSINT in cybersecurity
- Understand legal and ethical considerations

### What is Open Source Intelligence?

OSINT refers to intelligence collected from publicly available sources. Unlike classified intelligence, OSINT is gathered from:

- **Internet sources**: Websites, social media, forums, blogs
- **Public government data**: Court records, public filings, government reports
- **Traditional media**: Newspapers, magazines, TV, radio
- **Academic publications**: Research papers, theses, dissertations
- **Commercial data**: Business directories, financial reports

### Types of OSINT

1. **Social Media Intelligence (SOCMINT)**: Information gathered from social platforms
2. **Web Intelligence (WEBINT)**: Data from websites, blogs, and online services
3. **Technical Intelligence**: Network data, DNS records, IP information
4. **Human Intelligence (HUMINT)**: Information from human sources (ethics apply)
5. **Geospatial Intelligence (GEOINT)**: Location-based information from maps and imagery

### OSINT in Cybersecurity

Security professionals use OSINT for:
- **Penetration testing**: Gathering target information before testing
- **Threat intelligence**: Identifying potential threats and vulnerabilities
- **Incident response**: Investigating security breaches
- **Brand protection**: Monitoring for impersonation and fraud
- **Due diligence**: Verifying information about business partners

### Key Takeaways
- OSINT is a powerful tool for cybersecurity professionals
- It relies on legally accessible, publicly available information
- Proper OSINT skills are essential for modern security assessments
- Always operate within legal and ethical boundaries

### Commands and Tools
\`\`\`bash
# Basic OSINT tools
theHarvester -d target.com -b google
maltego          # Visual link analysis
shodan.io        # IoT and infrastructure search
censys.io        # Certificate and host search
\`\`\`

### Real-World Example
A penetration tester uses OSINT to discover that a target company's employee posted a screenshot on Twitter showing their internal network diagram. This information could be used to map the network and identify potential attack vectors.

### Practice Exercise
1. Search for your own name on Google
2. Check what information is publicly available about your email address
3. Use Shodan to search for devices in your local network range
4. Document your findings and assess the privacy implications`,

    "OSINT Methodology": `## OSINT Methodology

A systematic approach to gathering and analyzing open source intelligence ensures thoroughness and reproducibility in your investigations.

### Learning Objectives
- Learn the structured OSINT collection process
- Understand the intelligence cycle
- Master the 5x5x5 methodology
- Apply systematic approaches to OSINT tasks

### The Intelligence Cycle

1. **Planning & Direction**: Define objectives and requirements
2. **Collection**: Gather raw data from various sources
3. **Processing**: Organize and structure collected data
4. **Analysis**: Interpret data to produce intelligence
5. **Dissemination**: Share findings with stakeholders

### The 5x5x5 Methodology

This framework helps organize your OSINT collection:
- **5 W's**: Who, What, When, Where, Why
- **5 H's**: How, How many, How much, How often, How long
- **5 Sources**: Minimum sources to verify each piece of information

### Collection Phase

#### Passive Collection
- Search engine queries
- Social media monitoring
- Public database searches
- WHOIS and DNS lookups
- Certificate transparency logs

#### Active Collection
- Direct website interaction
- Service scanning
- API queries
- Form submissions
- Network probing (with authorization)

### Processing Phase

1. **Data Cleaning**: Remove duplicates and irrelevant information
2. **Normalization**: Standardize formats and timestamps
3. **Categorization**: Organize by type, source, and relevance
4. **Storage**: Document everything with proper attribution

### Analysis Phase

- **Link Analysis**: Connect related pieces of information
- **Timeline Analysis**: Establish chronological order of events
- **Pattern Recognition**: Identify trends and recurring themes
- **Gap Analysis**: Determine what information is missing

### Key Takeaways
- Always follow a systematic methodology
- Document your sources and methods
- Verify information from multiple sources
- Maintain chain of custody for evidence

### Commands and Tools
\`\`\`bash
# Documentation tools
mindmap          # Create visual connection maps
timeline         # Build chronological timelines
\`\`\`

### Practice Exercise
1. Choose a target domain
2. Plan your OSINT collection using the 5x5x5 methodology
3. Collect information from at least 5 different source types
4. Process and organize your findings
5. Create a link analysis map connecting your findings`,

    "Ethical Considerations": `## Ethical Considerations in OSINT

Operating ethically and legally is paramount in OSINT. Violations can result in legal consequences and damage to professional reputation.

### Learning Objectives
- Understand legal boundaries of OSINT activities
- Recognize ethical guidelines for security researchers
- Learn responsible disclosure principles
- Understand privacy laws and regulations

### Legal Framework

#### Key Laws to Know
- **Computer Fraud and Abuse Act (CFAA)**: US federal law on unauthorized computer access
- **General Data Protection Regulation (GDPR)**: EU data protection regulation
- **Privacy Act**: US law governing collection of personal information
- **Stored Communications Act**: US law on electronic communications

#### What You CAN Do
- Access publicly available information
- Use search engines and public databases
- Analyze social media profiles set to public
- Query WHOIS and DNS records
- Use Shodan and similar services

#### What You CANNOT Do
- Access private accounts without authorization
- Bypass authentication mechanisms
- Scrape non-public data
- Stalk or harass individuals
- Use information for malicious purposes

### Ethical Guidelines

1. **Authorization**: Always have proper authorization before testing
2. **Scope**: Stay within the defined scope of engagement
3. **Privacy**: Respect individual privacy rights
4. **Proportionality**: Only collect what's necessary for the objective
5. **Transparency**: Be honest about your methods and findings
6. **Do No Harm**: Avoid causing damage to systems or individuals

### Responsible Disclosure

When you discover vulnerabilities:
1. Document the finding thoroughly
2. Notify the affected organization
3. Allow reasonable time for remediation
4. Avoid public disclosure before fixes are available
5. Follow coordinated disclosure practices

### Key Takeaways
- Always operate within legal boundaries
- Obtain proper authorization before any testing
- Respect privacy and individual rights
- Follow responsible disclosure principles
- Document your activities for accountability

### Practice Exercise
1. Review the CFAA and identify 3 activities that could be considered illegal
2. Draft a responsible disclosure policy for a hypothetical vulnerability
3. Create a checklist of legal considerations before starting an OSINT investigation`,

    "Google Dorking": `## Google Dorking

Google Dorking (also known as Google Hacking) uses advanced search operators to find specific information that standard searches might miss.

### Learning Objectives
- Master advanced Google search operators
- Learn to construct effective search queries
- Understand how to find exposed sensitive data
- Apply Google Dorking in security assessments

### Basic Operators

| Operator | Description | Example |
|----------|-------------|---------|
| site: | Search within a specific site | site:example.com |
| filetype: | Search for specific file types | filetype:pdf |
| inurl: | Find URLs containing specific text | inurl:admin |
| intitle: | Find pages with specific title | intitle:"login" |
| intext: | Find pages containing specific text | intext:"password" |
| cache: | Show cached version of page | cache:example.com |

### Advanced Queries

#### Finding Exposed Files
\`\`\`
site:target.com filetype:pdf
site:target.com filetype:doc OR filetype:docx
site:target.com filetype:xlsx
site:target.com filetype:sql
\`\`\`

#### Finding Login Pages
\`\`\`
site:target.com inurl:login
site:target.com intitle:"login"
site:target.com inurl:admin
\`\`\`

#### Finding Sensitive Information
\`\`\`
site:target.com intext:"password"
site:target.com intext:"username"
site:target.com filetype:env
site:target.com filetype:log
\`\`\`

#### Finding Configuration Files
\`\`\`
site:target.com filetype:xml
site:target.com filetype:json
site:target.com filetype:yml
site:target.com filetype:conf
\`\`\`

### Real-World Example
\`\`\`
site:github.com "target.com" password
site:pastebin.com "target.com" credentials
\`\`\`

### Key Takeaways
- Google Dorking is a powerful passive reconnaissance technique
- Always use it ethically and with proper authorization
- Combine multiple operators for more effective searches
- Regularly monitor your own organization for exposed data

### Practice Exercise
1. Find all PDF files on a public website using Google Dorking
2. Search for exposed configuration files on GitHub
3. Find login pages on a target domain
4. Create a Google Dork cheat sheet for your team`,

    "Search Engine Alternatives": `## Search Engine Alternatives

While Google is the most popular search engine, several alternatives offer unique features and better privacy for OSINT operations.

### Learning Objectives
- Explore alternative search engines for OSINT
- Understand the strengths of each platform
- Learn when to use different search tools
- Master privacy-focused search options

### Major Search Engine Alternatives

#### Bing
- Good for finding different results than Google
- Often indexes content Google doesn't
- Better for finding social media content
- Bing Image Search is excellent for reverse image searches

#### DuckDuckGo
- Privacy-focused, no tracking
- Good for unbiased search results
- Bangs feature (!g, !w, !yt) for quick redirects
- Growing index of web content

#### Yandex
- Best for reverse image searches
- Strong in Russian-language content
- Different algorithm than Western engines
- Excellent face recognition in images

#### Baidu
- Largest search engine in China
- Good for finding Chinese websites and content
- Useful for targeting Chinese companies

### Specialized Search Engines

#### Shodan
- Search engine for IoT devices
- Find cameras, SCADA systems, databases
- Search by port, country, vulnerability
- Essential for infrastructure reconnaissance

#### Censys
- Certificate transparency logs
- Host and website information
- SSL/TLS certificate data
- Good for finding subdomains

#### Crt.sh
- Certificate transparency search
- Find subdomains via certificate logs
- Free and fast
- Good for reconnaissance

### Privacy-Focused Tools

#### Startpage
- Google results without tracking
- Anonymous view feature
- No search history stored

#### Searx
- Meta-search engine
- Aggregates results from multiple engines
- Self-hostable
- No tracking or profiling

### Key Takeaways
- Don't rely on a single search engine
- Use Yandex for reverse image searches
- Shodan is essential for infrastructure OSINT
- Privacy tools help protect your identity during research

### Practice Exercise
1. Search the same query on Google, Bing, and DuckDuckGo - compare results
2. Use Yandex reverse image search on a photo
3. Search Shodan for devices in your organization's IP range
4. Find subdomains of a target using crt.sh`,

    "Social Media Search": `## Social Media Search

Social media platforms are rich sources of OSINT data. Each platform offers unique information and requires different search techniques.

### Learning Objectives
- Master social media search techniques for each platform
- Understand platform-specific data availability
- Learn to aggregate social media intelligence
- Apply privacy considerations to social media OSINT

### Platform-Specific Techniques

#### Twitter/X
\`\`\`
# Search operators
from:username          # Tweets from specific user
to:username           # Replies to specific user
@username             # Mentions of user
#hashtag              # Hashtag search
"exact phrase"        # Exact phrase search
filter:links          # Only tweets with links
filter:images         # Only tweets with images
\`\`\`

#### LinkedIn
- Search by company, title, location
- View employee counts and departments
- Find technology stacks used
- Identify key personnel

#### Facebook
- Check public profiles and posts
- Look at group memberships
- Find event attendance
- Review photo tags and locations

#### Instagram
- Search hashtags and locations
- Check tagged photos
- View story highlights
- Analyze posting patterns

#### Reddit
- Search user post history
- Find subreddit memberships
- Identify interests and affiliations
- Track account creation dates

### Aggregation Tools

1. **Namechk**: Check username availability across platforms
2. **Social Searcher**: Multi-platform social media search
3. **TweetDeck**: Advanced Twitter monitoring
4. **Instagram OSINT**: Specialized Instagram tools

### Data Points to Collect
- Profile information (bio, location, website)
- posting patterns and timestamps
- Connections and followers
- Content and media shared
- Location data and check-ins

### Key Takeaways
- Each social platform requires different search techniques
- Combine data from multiple platforms for complete picture
- Respect privacy settings and terms of service
- Document all findings with screenshots and timestamps

### Practice Exercise
1. Search for a specific person across 3 social platforms
2. Use Twitter advanced search to find posts about a specific topic
3. Find all Instagram posts tagged at a specific location
4. Create a social media profile report for a hypothetical target`
  },
};

// Generate generic content for lessons not specifically covered
function generateGenericContent(lessonTitle: string, moduleName: string, courseTitle: string): string {
  return `## ${lessonTitle}

This lesson covers the essential concepts and practical applications of ${lessonTitle.toLowerCase()} within the context of ${courseTitle}.

### Learning Objectives
- Understand the core concepts of ${lessonTitle.toLowerCase()}
- Learn practical techniques and methodologies
- Apply knowledge to real-world scenarios
- Complete hands-on exercises

### Overview

${lessonTitle} is a fundamental topic in ${moduleName}. Understanding this concept is crucial for cybersecurity professionals as it forms the basis for more advanced techniques covered later in this course.

### Key Concepts

1. **Definition and Scope**: ${lessonTitle} encompasses a range of techniques and methodologies used in modern cybersecurity.

2. **Importance**: This topic is essential because it directly impacts how security professionals approach their work.

3. **Applications**: The concepts covered here are applied in penetration testing, incident response, and security auditing.

### Practical Applications

In real-world scenarios, ${lessonTitle.toLowerCase()} is used to:
- Identify and assess security vulnerabilities
- Improve security posture of organizations
- Respond to security incidents effectively
- Conduct thorough security assessments

### Best Practices

1. **Stay Updated**: Keep current with the latest developments in this area
2. **Practice Regularly**: Hands-on experience is crucial for mastery
3. **Document Everything**: Maintain detailed records of your findings
4. **Follow Ethics**: Always operate within legal and ethical boundaries

### Commands and Tools

\`\`\`bash
# Relevant tools and commands for ${lessonTitle.toLowerCase()}
# Install and configure the necessary tools
# Practice in a safe, controlled environment
\`\`\`

### Real-World Scenario

A security professional encounters a situation where knowledge of ${lessonTitle.toLowerCase()} is directly applicable. By applying the concepts learned in this lesson, they can effectively address the security challenge.

### Key Takeaways
- ${lessonTitle} is a critical topic in cybersecurity
- Practical application requires hands-on practice
- Always follow ethical guidelines and legal requirements
- Document your findings and share knowledge with your team

### Practice Exercise
1. Set up a practice environment to explore ${lessonTitle.toLowerCase()}
2. Follow the step-by-step guide to apply the techniques
3. Document your findings and observations
4. Discuss your results with peers or in study groups

### Additional Resources
- Official documentation and guides
- Community forums and discussions
- Practice platforms and labs
- Academic research and papers`;
}

async function main() {
  console.log("Generating comprehensive lesson content...\n");

  const courses = await prisma.course.findMany({
    include: { modules: { include: { lessons: true } } },
    orderBy: { sortOrder: "asc" },
  });

  let totalUpdated = 0;

  for (const course of courses) {
    console.log(`Processing: ${course.title}`);
    const courseLessons = courseContent[course.title] || {};

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        // Use specific content if available, otherwise generate generic
        const content = courseLessons[lesson.title] ||
          generateGenericContent(lesson.title, mod.title, course.title);

        await prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            content,
            contentType: "TEXT",
          },
        });

        totalUpdated++;
        console.log(`  ✓ ${lesson.title}`);
      }
    }
  }

  console.log(`\nDone! Updated ${totalUpdated} lessons with comprehensive content.`);
  await prisma.$disconnect();
}

main().catch(console.error);
