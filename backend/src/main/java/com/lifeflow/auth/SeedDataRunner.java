package com.lifeflow.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Component
public class SeedDataRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedDataRunner.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${SEED_ADMIN_PASSWORD:admin123}")
    private String adminPassword;

    @Value("${SEED_PARAMEDIC_PASSWORD:paramedic123}")
    private String paramedicPassword;

    @Value("${SEED_CONTROL_PASSWORD:control123}")
    private String controlPassword;

    @Value("${SEED_HOSPITAL_PASSWORD:hospital123}")
    private String hospitalPassword;

    @Value("${SEED_CLINICIAN_PASSWORD:clinician123}")
    private String clinicianPassword;

    public SeedDataRunner(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Checking and seeding default system roles and demo users...");

        Role roleAdmin = getOrCreateRole("ROLE_ADMIN", "Administrator");
        Role roleParamedic = getOrCreateRole("ROLE_PARAMEDIC", "Paramedic");
        Role roleControl = getOrCreateRole("ROLE_CONTROL_ROOM", "Control Room Dispatcher");
        Role roleHospital = getOrCreateRole("ROLE_HOSPITAL_OPERATOR", "Hospital ED Operator");
        Role roleClinician = getOrCreateRole("ROLE_CLINICIAN_VIEWER", "Clinician Viewer");

        seedUser("admin", "admin@lifeflow.local", adminPassword, "System Administrator", Set.of(roleAdmin), null, "IT Administration");
        seedUser("paramedic", "paramedic@lifeflow.local", paramedicPassword, "Lead Paramedic John Doe", Set.of(roleParamedic), null, "Emergency Medical Services");
        seedUser("control", "control@lifeflow.local", controlPassword, "Dispatch Controller Sarah Connor", Set.of(roleControl), null, "Central Command Dispatch");
        
        // Regional In-Charge
        seedUser("hospital", "hospital@lifeflow.local", hospitalPassword, "Regional Triage Supervisor", Set.of(roleHospital), null, "Regional Emergency Command");

        // Hospital-Specific In-Charges (Separate Credential per Hospital)
        seedUser("hosp_stjude", "stjude_incharge@lifeflow.local", "stjude123", "St. Jude ED In-Charge (HOSP-001)", Set.of(roleHospital), "HOSP-001", "Emergency Department");
        seedUser("hosp_metro", "metro_incharge@lifeflow.local", "metro123", "Metro General ED In-Charge (HOSP-002)", Set.of(roleHospital), "HOSP-002", "Emergency Department");
        seedUser("hosp_westside", "westside_incharge@lifeflow.local", "westside123", "Westside Community In-Charge (HOSP-003)", Set.of(roleHospital), "HOSP-003", "Emergency Department");
        seedUser("hosp_apex", "apex_incharge@lifeflow.local", "apex123", "Apex Regional Trauma ED In-Charge (HOSP-APX-5417)", Set.of(roleHospital), "HOSP-APX-5417", "Emergency Department");

        // Specialist Doctors & Surgeons (Separate Credential per Doctor)
        seedUser("doctor_trauma", "dr.house@stjude.local", "doctor123", "Dr. Robert House, MD (Trauma Surgery & Resuscitation)", Set.of(roleClinician), "HOSP-001", "Trauma Surgery & Resuscitation");
        seedUser("doctor_cardio", "dr.watson@stjude.local", "doctor123", "Dr. Emily Watson, MD (Interventional Cardiology)", Set.of(roleClinician), "HOSP-001", "Interventional Cardiology & Cath Lab");
        seedUser("doctor_apex", "dr.vance@apex.local", "doctor123", "Dr. Alexander Vance, MD, FACS (Chief Trauma Surgeon)", Set.of(roleClinician), "HOSP-APX-5417", "Trauma Surgery & Resuscitation");
        seedUser("doctor_apex_neuro", "dr.sharma@apex.local", "doctor123", "Dr. Priya Sharma, MD (Consultant Neurosurgeon)", Set.of(roleClinician), "HOSP-APX-5417", "Neurotrauma & Critical Care");
        seedUser("doctor_apex_cardio", "dr.nair@apex.local", "doctor123", "Dr. Rajesh Nair, MD (Interventional Cardiologist)", Set.of(roleClinician), "HOSP-APX-5417", "Emergency Cardiology & Cath Lab");
        seedUser("clinician", "clinician@lifeflow.local", clinicianPassword, "Dr. Stephen Strange, MD (Neurotrauma & Critical Care)", Set.of(roleClinician), "HOSP-002", "Neurotrauma & Critical Care");
        seedUser("doctor_metro", "dr.wilson@metro.local", "doctor123", "Dr. James Wilson, MD (Emergency Medicine)", Set.of(roleClinician), "HOSP-002", "Emergency Medicine");

        log.info("Default roles and demo user seeding completed successfully.");
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role(name, description);
            return roleRepository.save(role);
        });
    }

    private void seedUser(String username, String email, String password, String fullName, Set<Role> roles, String hospitalCode, String department) {
        Set<Role> mutableRoles = new HashSet<>(roles);
        User user = userRepository.findByUsername(username).orElseGet(() -> {
            User newUser = new User(username, email, passwordEncoder.encode(password), fullName, hospitalCode, department);
            newUser.setRoles(mutableRoles);
            newUser.setActive(true);
            return newUser;
        });

        // Ensure hospitalCode and department are synchronized
        user.setHospitalCode(hospitalCode);
        user.setDepartment(department);
        user.setFullName(fullName);
        user.setRoles(mutableRoles);
        userRepository.save(user);
        log.info("Seeded/Synchronized user: {} ({}) [Hospital: {}, Dept: {}]", username, email, hospitalCode, department);
    }
}
