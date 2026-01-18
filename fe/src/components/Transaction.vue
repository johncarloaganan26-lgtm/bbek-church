  <template>
    <div class="transactions-wrapper">
        <div class="transactions-container">
          <div class="transactions">
      <div class="d-flex justify-space-between align-center mb-6">
        <h1 class="text-h4 font-weight-bold">    </h1>
      </div>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <!-- <v-col
        v-for="total in totalsByServiceType"
        :key="total.type_of_service"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          elevation="3"
          :color="getServiceTypeColor(total.type_of_service)"
          class="summary-card"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-white text-uppercase mb-1">
                  {{ formatServiceType(total.type_of_service) }}
                </div>
                <div class="text-h5 font-weight-bold text-white">
                  ₱{{ formatCurrency(total.total_amount) }}
                </div>
                <div class="text-caption text-white mt-1">
                  {{ total.transaction_count }} transaction{{ total.transaction_count !== 1 ? 's' : '' }}
                </div>
              </div>
              <v-icon
                :icon="getServiceTypeIcon(total.type_of_service)"
                size="48"
                color="white"
                class="opacity-75"
              ></v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col> -->
      
      <!-- Grand Total Card -->
      <!-- <v-col cols="12" sm="6" md="3">
        <v-card
          elevation="3"
          color="primary"
          class="summary-card"
        >
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-white text-uppercase mb-1">
                  Grand Total
                </div>
                <div class="text-h5 font-weight-bold text-white">
                  ₱{{ formatCurrency(summaryStats.grand_total) }}
                </div>
                <div class="text-caption text-white mt-1">
                  {{ summaryStats.total_transactions }} total transaction{{ summaryStats.total_transactions !== 1 ? 's' : '' }}
                </div>
              </div>
              <v-icon
                icon="mdi-cash-multiple"
                size="48"
                color="white"
                class="opacity-75"
              ></v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col> -->
    </v-row>

      <!-- Services Tables Section -->
      <v-card class="mt-6" elevation="2">
        <v-card-title class="d-flex justify-space-between align-center mb-4">
          <span class="text-h5 font-weight-bold">All Transactions Records</span>
          <v-select
            v-model="selectedServiceTypeFilter"
            :items="serviceTypeSelectOptions"
            item-title="title"
            item-value="value"
            label="Select Service Type"
            variant="outlined"
            density="compact"
            style="max-width: 250px;"
            hide-details
          ></v-select>
        </v-card-title>
        <v-card-text>
          <!-- Debug Info (remove in production) -->
          <div v-if="false" class="mb-4 pa-2 bg-grey-lighten-4">
            <p>Selected: {{ selectedServiceTypeFilter }}</p>
            <p>Water Baptism: {{ waterBaptismServices.length }} items</p>
            <p>Marriage: {{ marriageServices.length }} items</p>
            <p>Burial: {{ burialServices.length }} items</p>
            <p>Child Dedication: {{ childDedicationServices.length }} items</p>
          </div>
          <v-row>
            <!-- All Transactions Table -->
            <v-col v-if="selectedServiceTypeFilter === 'all'" cols="12">
              <v-card variant="outlined" class="mx-auto" style="max-width: 100%;">
                <v-card-title class="text-h6 font-weight-bold text-center">All Transactions</v-card-title>
                <v-card-text>
                  <v-table density="compact" sort-by="[{ key: 'sort_date', order: 'desc' }]">
                    <thead>
                      <tr>
                        <th class="text-left">Service Type</th>
                        <th class="text-left">Service ID</th>
                        <th class="text-left">Name/Details</th>
                        <th class="text-left">Status</th>
                        <th class="text-left">Service Date</th>
                        <th class="text-left">Location</th>
                        <th class="text-left">Date Created</th>
                        <th class="text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="allTransactions.length === 0">
                        <td colspan="8" class="text-center py-4 text-grey">No transactions found</td>
                      </tr>
                      <tr v-for="transaction in allTransactions" :key="`${transaction.service_type}-${transaction.service_id}`">
                        <td>{{ transaction.service_type }}</td>
                        <td @click="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))" style="cursor: pointer;" class="text-primary font-weight-medium">{{ transaction.service_id }}</td>
                        <td @click="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))" style="cursor: pointer;">{{ transaction.display_name }}</td>
                        <td @click="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))" style="cursor: pointer;">
                          <v-chip size="small" :color="getStatusColor(transaction.status)">
                            {{ transaction.status }}
                          </v-chip>
                        </td>
                        <td @click="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))" style="cursor: pointer;">{{ getServiceDate(transaction) || 'N/A' }}</td>
                        <td @click="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))" style="cursor: pointer;">{{ transaction.location || 'N/A' }}</td>
                        <td @click="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))" style="cursor: pointer;">{{ formatDateTime(transaction.date_created) }}</td>
                        <td>
                          <v-btn
                            v-if="transaction.status?.toLowerCase() === 'completed' && transaction.service_type !== 'Burial Service'"
                            icon="mdi-certificate"
                            variant="text"
                            size="small"
                            color="primary"
                            @click.stop="viewServiceCertificate(transaction, getServiceTypeKey(transaction.service_type))"
                            title="View Certificate"
                          ></v-btn>
                          <v-btn
                            icon="mdi-eye"
                            variant="text"
                            size="small"
                            color="blue"
                            @click.stop="viewServiceDetails(transaction, getServiceTypeKey(transaction.service_type))"
                            title="View Details"
                          ></v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Water Baptism Table -->
            <v-col v-if="selectedServiceTypeFilter === 'water_baptism'" cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-h6 font-weight-bold">Water Baptism</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="text-left">Service ID</th>
                        <th class="text-left">Status</th>
                        <th class="text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="servicesLoading.waterBaptism">
                        <td colspan="3" class="text-center py-4">
                          <v-progress-circular indeterminate size="24"></v-progress-circular>
                        </td>
                      </tr>
                      <tr v-else-if="waterBaptismServices.length === 0">
                        <td colspan="3" class="text-center py-4 text-grey">No records found</td>
                      </tr>
                      <tr v-for="service in waterBaptismServices" :key="service.baptism_id">
                        <td @click="viewServiceDetails(service, 'water_baptism')" style="cursor: pointer;">{{ service.baptism_id }}</td>
                        <td @click="viewServiceDetails(service, 'water_baptism')" style="cursor: pointer;">
                          <v-chip size="small" :color="getStatusColor(service.status)">
                            {{ service.status }}
                          </v-chip>
                        </td>
                        <td>
                          <v-btn
                            v-if="service.status?.toLowerCase() === 'completed'"
                            icon="mdi-certificate"
                            variant="text"
                            size="small"
                            color="primary"
                            @click.stop="viewServiceCertificate(service, 'water_baptism')"
                            title="View Certificate"
                          ></v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Marriage Service Table -->
            <v-col v-if="selectedServiceTypeFilter === 'marriage'" cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-h6 font-weight-bold">Marriage Service</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="text-left">Service ID</th>
                        <th class="text-left">Groom</th>
                        <th class="text-left">Bride</th>
                        <th class="text-left">Status</th>
                        <th class="text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="servicesLoading.marriage">
                        <td colspan="5" class="text-center py-4">
                          <v-progress-circular indeterminate size="24"></v-progress-circular>
                        </td>
                      </tr>
                      <tr v-else-if="marriageServices.length === 0">
                        <td colspan="5" class="text-center py-4 text-grey">No records found</td>
                      </tr>
                      <tr v-for="service in marriageServices" :key="service.marriage_id">
                        <td @click="viewServiceDetails(service, 'marriage')" style="cursor: pointer;">{{ service.marriage_id }}</td>
                        <td @click="viewServiceDetails(service, 'marriage')" style="cursor: pointer;">{{ getGroomDisplayName(service) }}</td>
                        <td @click="viewServiceDetails(service, 'marriage')" style="cursor: pointer;">{{ getBrideDisplayName(service) }}</td>
                        <td @click="viewServiceDetails(service, 'marriage')" style="cursor: pointer;">
                          <v-chip size="small" :color="getStatusColor(service.status)">
                            {{ service.status }}
                          </v-chip>
                        </td>
                        <td>
                          <v-btn
                            v-if="service.status?.toLowerCase() === 'completed'"
                            icon="mdi-certificate"
                            variant="text"
                            size="small"
                            color="primary"
                            @click.stop="viewServiceCertificate(service, 'marriage')"
                            title="View Certificate"
                          ></v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Burial Service Table -->
            <v-col v-if="selectedServiceTypeFilter === 'burial'" cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-h6 font-weight-bold">Burial Service</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="text-left">Service ID</th>
                        <th class="text-left">Status</th>
                        <th class="text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="servicesLoading.burial">
                        <td colspan="3" class="text-center py-4">
                          <v-progress-circular indeterminate size="24"></v-progress-circular>
                        </td>
                      </tr>
                      <tr v-else-if="burialServices.length === 0">
                        <td colspan="3" class="text-center py-4 text-grey">No records found</td>
                      </tr>
                      <tr v-for="service in burialServices" :key="service.burial_id">
                        <td @click="viewServiceDetails(service, 'burial')" style="cursor: pointer;">{{ service.burial_id }}</td>
                        <td @click="viewServiceDetails(service, 'burial')" style="cursor: pointer;">
                          <v-chip size="small" :color="getStatusColor(service.status)">
                            {{ service.status }}
                          </v-chip>
                        </td>
                        <td>
                          <v-btn
                            v-if="service.status?.toLowerCase() === 'completed'"
                            icon="mdi-certificate"
                            variant="text"
                            size="small"
                            color="primary"
                            @click.stop="viewServiceCertificate(service, 'burial')"
                            title="View Certificate"
                          ></v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Child Dedication Table -->
            <v-col v-if="selectedServiceTypeFilter === 'child_dedication'" cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-h6 font-weight-bold">Child Dedication</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="text-left">Service ID</th>
                        <th class="text-left">Status</th>
                        <th class="text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="servicesLoading.childDedication">
                        <td colspan="3" class="text-center py-4">
                          <v-progress-circular indeterminate size="24"></v-progress-circular>
                        </td>
                      </tr>
                      <tr v-else-if="childDedicationServices.length === 0">
                        <td colspan="3" class="text-center py-4 text-grey">No records found</td>
                      </tr>
                      <tr v-for="service in childDedicationServices" :key="service.child_id">
                        <td @click="viewServiceDetails(service, 'child_dedication')" style="cursor: pointer;">{{ service.child_id }}</td>
                        <td @click="viewServiceDetails(service, 'child_dedication')" style="cursor: pointer;">
                          <v-chip size="small" :color="getStatusColor(service.status)">
                            {{ service.status }}
                          </v-chip>
                        </td>
                        <td>
                          <v-btn
                            v-if="service.status?.toLowerCase() === 'completed'"
                            icon="mdi-certificate"
                            variant="text"
                            size="small"
                            color="primary"
                            @click.stop="viewServiceCertificate(service, 'child_dedication')"
                            title="View Certificate"
                          ></v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Certificate Dialog -->
      <CertificateDialog
        v-model="certificateDialog"
        :certificate-data="certificateData"
        :certificate-type="certificateType"
        @update:model-value="certificateDialog = $event"
        @print="isPrint = $event"
      />

      <!-- Service Details Dialog -->
      <v-dialog v-model="serviceDetailsDialog" max-width="800px" scrollable>
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5 font-weight-bold">{{ getServiceTypeTitle(selectedServiceType) }} Details</span>
            <v-btn icon="mdi-close" variant="text" @click="serviceDetailsDialog = false"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-6">
            <div v-if="selectedServiceData">
              <!-- Water Baptism Details -->
              <template v-if="selectedServiceType === 'water_baptism'">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Service ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.baptism_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Status</div>
                      <v-chip size="small" :color="getStatusColor(selectedServiceData.status)">
                        {{ selectedServiceData.status || 'N/A' }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Member Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.fullname || `${selectedServiceData.firstname || ''} ${selectedServiceData.lastname || ''}`.trim() || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Email</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.email || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Phone Number</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.phone_number || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Birthdate</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDate(selectedServiceData.birthdate) || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Age</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.age || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Gender</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.gender || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Address</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.address || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Civil Status</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.civil_status || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Profession</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.profession || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Spouse Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.spouse_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Marriage Date</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDate(selectedServiceData.marriage_date) || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Children</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.children || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Desire of Ministry</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.desire_ministry || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Baptism Date</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDate(selectedServiceData.baptism_date) || 'Not scheduled' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Preferred Baptism Time</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.preferred_baptism_time || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Location</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.location || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Pastor Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.pastor_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Guardian Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.guardian_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Guardian Contact</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.guardian_contact || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Guardian Relationship</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.guardian_relationship || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Date Created</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDateTime(selectedServiceData.date_created) || 'N/A' }}</div>
                    </div>
                  </v-col>
                </v-row>
              </template>

              <!-- Marriage Service Details -->
              <template v-else-if="selectedServiceType === 'marriage'">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Service ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.marriage_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Status</div>
                      <v-chip size="small" :color="getStatusColor(selectedServiceData.status)">
                        {{ selectedServiceData.status || 'N/A' }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Groom Name</div>
                      <div class="text-body-1 font-weight-medium">{{ getGroomDisplayName(selectedServiceData) }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Bride Name</div>
                      <div class="text-body-1 font-weight-medium">{{ getBrideDisplayName(selectedServiceData) }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Groom Member ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.groom_member_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Bride Member ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.bride_member_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Marriage Date</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.marriage_date ? formatDateTime(selectedServiceData.marriage_date) : 'Not scheduled' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Location</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.location || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Pastor Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.pastor_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Pastor ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.pastor_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" v-if="selectedServiceData.guardians && Array.isArray(selectedServiceData.guardians) && selectedServiceData.guardians.length > 0">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Guardians</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.guardians.join(', ') }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Groom Age</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.groom_age || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Bride Age</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.bride_age || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Date Created</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDateTime(selectedServiceData.date_created) || 'N/A' }}</div>
                    </div>
                  </v-col>
                </v-row>
              </template>

              <!-- Burial Service Details -->
              <template v-else-if="selectedServiceType === 'burial'">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Service ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.burial_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Status</div>
                      <v-chip size="small" :color="getStatusColor(selectedServiceData.status)">
                        {{ selectedServiceData.status || 'N/A' }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Member Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.fullname || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Member ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.member_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Requester Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.requester_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Requester Email</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.requester_email || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Deceased Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.deceased_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Deceased Birthdate</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDate(selectedServiceData.deceased_birthdate) || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Date of Death</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDateTime(selectedServiceData.date_death) || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Relationship to Deceased</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.relationship || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Service Date</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDateTime(selectedServiceData.service_date) || 'Not scheduled' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Location</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.location || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Pastor Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.pastor_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Date Created</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDateTime(selectedServiceData.date_created) || 'N/A' }}</div>
                    </div>
                  </v-col>
                </v-row>
              </template>

              <!-- Child Dedication Details -->
              <template v-else-if="selectedServiceType === 'child_dedication'">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Service ID</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.child_id || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Status</div>
                      <v-chip size="small" :color="getStatusColor(selectedServiceData.status)">
                        {{ selectedServiceData.status || 'N/A' }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Requested By (Member ID)</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.requested_by || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Requester Relationship</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.requester_relationship || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Child's First Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.child_firstname || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Child's Last Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.child_lastname || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Child's Middle Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.child_middle_name || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Date of Birth</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDate(selectedServiceData.date_of_birth) || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Place of Birth</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.place_of_birth || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Gender</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.gender === 'M' ? 'Male' : selectedServiceData.gender === 'F' ? 'Female' : selectedServiceData.gender || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Preferred Dedication Date</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDate(selectedServiceData.preferred_dedication_date) || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Preferred Dedication Time</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.preferred_dedication_time || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Contact Phone</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.contact_phone_number || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Contact Email</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.contact_email || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Contact Address</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.contact_address || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Father's Full Name</div>
                      <div class="text-body-1 font-weight-medium">{{ `${selectedServiceData.father_firstname || ''} ${selectedServiceData.father_lastname || ''}`.trim() || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Father's Email</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.father_email || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Mother's Full Name</div>
                      <div class="text-body-1 font-weight-medium">{{ `${selectedServiceData.mother_firstname || ''} ${selectedServiceData.mother_lastname || ''}`.trim() || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Mother's Email</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.mother_email || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Pastor Name</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.pastor || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Location</div>
                      <div class="text-body-1 font-weight-medium">{{ selectedServiceData.location || 'N/A' }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="detail-item mb-4">
                      <div class="text-caption text-grey mb-1">Date Created</div>
                      <div class="text-body-1 font-weight-medium">{{ formatDateTime(selectedServiceData.date_created) || 'N/A' }}</div>
                    </div>
                  </v-col>
                </v-row>
              </template>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="serviceDetailsDialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
    </div>
    </div>
    </template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CertificateDialog from '@/components/Dialogs/CertificateDialog.vue'
import axios from '@/api/axios'

// Get current user info
const user = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const memberId = computed(() => user.value?.member?.member_id || null)

// Service type select options for services section
const serviceTypeSelectOptions = [
  { title: 'All Transactions', value: 'all' },
  { title: 'Water Baptism', value: 'water_baptism' },
  { title: 'Marriage Service', value: 'marriage' },
  { title: 'Burial Service', value: 'burial' },
  { title: 'Child Dedication', value: 'child_dedication' }
]

// Selected service type for services display
const selectedServiceTypeFilter = ref('all')

// Combined all transactions
const allTransactions = computed(() => {
  const transactions = []
  waterBaptismServices.value.forEach(service => {
    transactions.push({
      ...service,
      service_type: 'Water Baptism',
      service_id: service.baptism_id,
      display_name: service.fullname,
      sort_date: new Date(service.date_created || service.baptism_date || 0)
    })
  })
  marriageServices.value.forEach(service => {
    transactions.push({
      ...service,
      service_type: 'Marriage Service',
      service_id: service.marriage_id,
      display_name: `${getGroomDisplayName(service)} & ${getBrideDisplayName(service)}`,
      sort_date: new Date(service.date_created || service.marriage_date || 0)
    })
  })
  burialServices.value.forEach(service => {
    transactions.push({
      ...service,
      service_type: 'Burial Service',
      service_id: service.burial_id,
      display_name: service.fullname,
      sort_date: new Date(service.date_created || service.service_date || 0)
    })
  })
  childDedicationServices.value.forEach(service => {
    transactions.push({
      ...service,
      service_type: 'Child Dedication',
      service_id: service.child_id,
      display_name: service.child_fullname || `${service.child_firstname || ''} ${service.child_lastname || ''}`.trim(),
      sort_date: new Date(service.date_created || service.preferred_dedication_date || 0)
    })
  })
  
  // Sort by status priority first, then by date descending
  return transactions.sort((a, b) => {
    // Status priority order: pending, approved, disapproved, completed, cancelled
    const statusOrder = {
      'pending': 1,
      'approved': 2,
      'disapproved': 3,
      'completed': 4,
      'cancelled': 5
    }
    
    const aPriority = statusOrder[a.status?.toLowerCase()] || 999
    const bPriority = statusOrder[b.status?.toLowerCase()] || 999
    
    // If status priority is different, sort by priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // If status priority is the same, sort by date descending
    return b.sort_date - a.sort_date
  })
})

// Dialog state
const certificateDialog = ref(false)
const certificateData = ref(null)
const certificateType = ref(null)
const isPrint = ref(false)
const serviceDetailsDialog = ref(false)
const selectedServiceData = ref(null)
const selectedServiceType = ref(null)

// Services data
const waterBaptismServices = ref([])
const marriageServices = ref([])
const burialServices = ref([])
const childDedicationServices = ref([])
const servicesLoading = ref({
  waterBaptism: false,
  marriage: false,
  burial: false,
  childDedication: false
})

// View certificate for service
const viewServiceCertificate = async (service, serviceType) => {
  try {
    if (!service || !serviceType) {
      ElMessage.error('Service information is missing')
      return
    }

    // Get service ID based on service type
    let serviceId = null
    switch (serviceType) {
      case 'water_baptism':
        serviceId = service.baptism_id
        break
      case 'marriage':
        serviceId = service.marriage_id
        break
      case 'burial':
        serviceId = service.burial_id
        break
      case 'child_dedication':
        serviceId = service.child_id
        break
      default:
        ElMessage.error('Invalid service type')
        return
    }

    if (!serviceId) {
      ElMessage.error('Service ID not found')
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    const response = await axios.get(`/transactions/getCertificateDataByService/${serviceId}/${serviceType}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.data && response.data.success) {
      certificateData.value = response.data.data
      certificateType.value = response.data.data.type
      certificateDialog.value = true
      isPrint.value = true
    } else {
      ElMessage.error(response.data?.message || 'Failed to load certificate data')
    }
  } catch (error) {
    console.error('Error fetching certificate data:', error)
    ElMessage.error('Failed to load certificate data')
  }
}

// Format functions
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}


// Fetch member services
const fetchWaterBaptismServices = async () => {
  if (!memberId.value) return
  servicesLoading.value.waterBaptism = true
  try {
    const response = await axios.get(`/services/water-baptisms/getWaterBaptismByMemberId/${memberId.value}`)
    console.log('Water Baptism Response:', response.data)
    if (response.data.success) {
      // Handle both array and single object responses
      if (Array.isArray(response.data.data)) {
        waterBaptismServices.value = response.data.data
      } else if (response.data.data) {
        waterBaptismServices.value = [response.data.data]
      } else {
        waterBaptismServices.value = []
      }
    } else {
      waterBaptismServices.value = []
    }
    console.log('Water Baptism Services:', waterBaptismServices.value)
  } catch (error) {
    console.error('Error fetching water baptism services:', error)
    waterBaptismServices.value = []
  } finally {
    servicesLoading.value.waterBaptism = false
  }
}

const fetchMarriageServices = async () => {
  if (!memberId.value) return
  servicesLoading.value.marriage = true
  try {
    // Fetch both as groom and bride
    const [groomResponse, brideResponse] = await Promise.all([
      axios.get(`/services/marriage-services/getMarriageServicesByGroomMemberId/${memberId.value}`).catch(() => ({ data: { success: false, data: [] } })),
      axios.get(`/services/marriage-services/getMarriageServicesByBrideMemberId/${memberId.value}`).catch(() => ({ data: { success: false, data: [] } }))
    ])
    
    console.log('Marriage Groom Response:', groomResponse.data)
    console.log('Marriage Bride Response:', brideResponse.data)
    
    const groomServices = groomResponse.data.success ? (Array.isArray(groomResponse.data.data) ? groomResponse.data.data : (groomResponse.data.data ? [groomResponse.data.data] : [])) : []
    const brideServices = brideResponse.data.success ? (Array.isArray(brideResponse.data.data) ? brideResponse.data.data : (brideResponse.data.data ? [brideResponse.data.data] : [])) : []
    
    // Combine and remove duplicates
    const allServices = [...groomServices, ...brideServices]
    const uniqueServices = allServices.filter((service, index, self) =>
      index === self.findIndex(s => s.marriage_id === service.marriage_id)
    )
    marriageServices.value = uniqueServices
    console.log('Marriage Services:', marriageServices.value)
  } catch (error) {
    console.error('Error fetching marriage services:', error)
    marriageServices.value = []
  } finally {
    servicesLoading.value.marriage = false
  }
}

const fetchBurialServices = async () => {
  if (!memberId.value) return
  servicesLoading.value.burial = true
  try {
    const response = await axios.get(`/church-records/burial-services/getBurialServicesByMemberId/${memberId.value}`)
    console.log('Burial Services Response:', response.data)
    if (response.data.success) {
      // The endpoint returns an array of burial services
      if (Array.isArray(response.data.data)) {
        burialServices.value = response.data.data
      } else {
        burialServices.value = []
      }
    } else {
      burialServices.value = []
    }
    console.log('Burial Services:', burialServices.value)
  } catch (error) {
    console.error('Error fetching burial services:', error)
    burialServices.value = []
  } finally {
    servicesLoading.value.burial = false
  }
}

const fetchChildDedicationServices = async () => {
  if (!memberId.value) return
  servicesLoading.value.childDedication = true
  try {
    const response = await axios.get(`/church-records/child-dedications/getChildDedicationsByRequester/${memberId.value}`)
    console.log('Child Dedication Response:', response.data)
    if (response.data.success) {
      // The new endpoint returns an array of dedications
      if (Array.isArray(response.data.data)) {
        childDedicationServices.value = response.data.data
      } else {
        childDedicationServices.value = []
      }
    } else {
      childDedicationServices.value = []
    }
    console.log('Child Dedication Services:', childDedicationServices.value)
  } catch (error) {
    console.error('Error fetching child dedication services:', error)
    childDedicationServices.value = []
  } finally {
    servicesLoading.value.childDedication = false
  }
}

// Status color helper
const getStatusColor = (status) => {
  const statusMap = {
    'pending': 'orange',
    'ongoing': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  }
  return statusMap[status?.toLowerCase()] || 'grey'
}

// Helper functions to get display names for groom and bride
const getGroomDisplayName = (service) => {
  // Priority: groom_fullname > groom_name > groom_member_id
  if (service.groom_fullname) return service.groom_fullname
  if (service.groom_name) return service.groom_name
  if (service.groom_member_id) return service.groom_member_id
  return 'N/A'
}

const getBrideDisplayName = (service) => {
  // Priority: bride_fullname > bride_name > bride_member_id
  if (service.bride_fullname) return service.bride_fullname
  if (service.bride_name) return service.bride_name
  if (service.bride_member_id) return service.bride_member_id
  return 'N/A'
}

// View service details
const viewServiceDetails = (service, serviceType) => {
  selectedServiceData.value = service
  selectedServiceType.value = serviceType
  serviceDetailsDialog.value = true
}

// Get service type key for function calls
const getServiceTypeKey = (serviceType) => {
  const keyMap = {
    'Water Baptism': 'water_baptism',
    'Marriage Service': 'marriage',
    'Burial Service': 'burial',
    'Child Dedication': 'child_dedication'
  }
  return keyMap[serviceType] || serviceType.toLowerCase()
}

// Get service type title
const getServiceTypeTitle = (type) => {
  const titleMap = {
    'water_baptism': 'Water Baptism',
    'marriage': 'Marriage Service',
    'burial': 'Burial Service',
    'child_dedication': 'Child Dedication'
  }
  return titleMap[type] || 'Service'
}

// Format date (without time)
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Get service date based on service type
const getServiceDate = (transaction) => {
  if (transaction.service_type === 'Water Baptism') return formatDateTime(transaction.baptism_date)
  if (transaction.service_type === 'Marriage Service') return formatDateTime(transaction.marriage_date)
  if (transaction.service_type === 'Burial Service') return formatDateTime(transaction.service_date)
  if (transaction.service_type === 'Child Dedication') return formatDate(transaction.preferred_dedication_date)
  return 'N/A'
}

// Fetch services on mount
onMounted(async () => {
  if (memberId.value) {
    // Fetch all services
    await Promise.all([
      fetchWaterBaptismServices(),
      fetchMarriageServices(),
      fetchBurialServices(),
      fetchChildDedicationServices()
    ])
  } else {
    ElMessage.error('Member ID not found. Please log in again.')
  }
})
</script>

<style scoped>
.transactions-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.full-width-nav {
  width: 100%;
}

.full-width-nav :deep(*) {
  width: 100%;
}

.transactions-container {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 24px;
}

.transactions {
  flex: 1;
  max-width: 1400px;
  width: 100%;
}

.summary-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.summary-card :deep(.v-card-text) {
  padding: 20px;
}

.detail-item {
  padding: 8px 0;
}

.detail-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding: 8px 12px;
  margin: 0 -12px;
}

@media (max-width: 960px) {
  .transactions-container {
    padding: 16px;
  }

  .transactions :deep(.v-card) {
    margin-bottom: 16px;
  }

  .transactions :deep(.v-data-table) {
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .transactions-container {
    padding: 12px;
  }

  .transactions :deep(.v-card-title) {
    font-size: 1.125rem !important;
  }

  .transactions :deep(.v-data-table) {
    font-size: 0.75rem;
  }

  .transactions :deep(.v-data-table-header) {
    font-size: 0.75rem;
  }

  .summary-card :deep(.v-card-text) {
    padding: 12px;
  }
}
</style>

